<script setup lang="ts">
interface Feedback {
  id: number
  tipo: string
  regiao: string
  unidade: string
  nota: number
  descricao: string
  created_at: string
}

const refreshInterval = 15000
const readFeedbackStorageKey = 'historico-feedbacks-lidos'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Histórico de Feedbacks',
  meta: [
    {
      name: 'description',
      content: 'Visualize e acompanhe todos os feedbacks registrados no sistema'
    }
  ]
})

const searchQuery = ref('')
const lastUpdated = ref<Date | null>(null)
const readFeedbackIds = ref(new Set<number>())

const { data: feedbacks, pending, error, refresh } = useAsyncData<Feedback[]>(
  'historico',
  () => $fetch('/api/historico'),
  {
    transform: data => data || []
  }
)

const refreshFeedbacks = async () => {
  await refresh()
  if (!error.value) lastUpdated.value = new Date()
}

const filteredFeedbacks = computed(() => {
  if (!feedbacks.value) return []
  const query = searchQuery.value.trim().toLocaleLowerCase('pt-BR')
  if (!query) return feedbacks.value

  return feedbacks.value.filter(feedback =>
    Object.values(feedback).some(value =>
      String(value ?? '').toLocaleLowerCase('pt-BR').includes(query)
    )
  )
})

const clearSearch = () => {
  searchQuery.value = ''
}

const toggleFeedbackRead = (id: number) => {
  if (readFeedbackIds.value.has(id)) {
    readFeedbackIds.value.delete(id)
  } else {
    readFeedbackIds.value.add(id)
  }

  try {
    localStorage.setItem(readFeedbackStorageKey, JSON.stringify([...readFeedbackIds.value]))
  } catch (storageError) {
    console.error('Erro ao salvar o estado de leitura dos feedbacks:', storageError)
  }
}

let refreshTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  try {
    const storedReadFeedbackIds: unknown = JSON.parse(
      localStorage.getItem(readFeedbackStorageKey) ?? '[]'
    )
    if (
      !Array.isArray(storedReadFeedbackIds)
      || storedReadFeedbackIds.some(id => typeof id !== 'number')
    ) {
      throw new Error('Formato inválido para os estados de leitura salvos')
    }
    readFeedbackIds.value = new Set(storedReadFeedbackIds)
  } catch (storageError) {
    console.error('Erro ao carregar o estado de leitura dos feedbacks:', storageError)
  }

  lastUpdated.value = new Date()
  refreshTimer = setInterval(() => {
    if (!pending.value) void refreshFeedbacks()
  }, refreshInterval)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

const formatUpdatedAt = (date: Date): string =>
  new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo'
  }).format(date)

const formatFeedbackDate = (date: string): string =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo'
  }).format(new Date(date))
</script>

<template>
  <div>
    <!-- Hero Section -->
    <UPageHero
      title="Histórico de Feedbacks"
      description="Acompanhe e analise todos os feedbacks registrados no sistema em uma interface intuitiva e responsiva."
      :ui="{
        root: 'relative overflow-hidden',
        container: 'flex items-center justify-between gap-6'
      }"
    />

    <!-- Main Content -->
    <UPageSection
      class="space-y-8"
      :ui="{ container: 'max-w-full' }"
    >
      <!-- Search and Stats Bar -->
      <div class="space-y-4">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <!-- Search Input -->
          <div class="w-full sm:flex-1">
            <UInput
              v-model="searchQuery"
              type="search"
              placeholder="Pesquisar em todas as colunas..."
              icon="i-lucide-search"
              size="lg"
              :ui="{ root: 'rounded-xl' }"
            />
          </div>

          <!-- Refresh Button -->
          <UButton
            icon="i-lucide-refresh-cw"
            :loading="pending"
            variant="soft"
            color="neutral"
            aria-label="Atualizar lista de feedbacks"
            @click="refreshFeedbacks"
          >
            Atualizar
          </UButton>
        </div>

        <p
          class="text-xs text-gray-500 dark:text-gray-400"
          role="status"
        >
          Atualização automática a cada 15 segundos
          <span v-if="lastUpdated"> · Última atualização: {{ formatUpdatedAt(lastUpdated) }}</span>
        </p>

        <!-- Stats -->
        <div
          v-if="feedbacks && feedbacks.length > 0"
          class="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/50"
          role="status"
          aria-label="Contador de feedbacks"
        >
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-file-text"
              class="h-5 w-5 text-green-600 dark:text-green-500"
              aria-hidden="true"
            />
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
              {{ filteredFeedbacks.length }} de {{ feedbacks.length }}
              <span class="text-gray-500 dark:text-gray-500">
                {{ feedbacks.length === 1 ? 'registro' : 'registros' }}
              </span>
            </span>
          </div>

          <div
            v-if="searchQuery"
            class="ml-auto"
          >
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
              aria-label="Limpar filtro de pesquisa"
              @click="clearSearch"
            >
              Limpar
            </UButton>
          </div>
        </div>
      </div>

      <!-- Loading State - Skeleton -->
      <div
        v-if="pending && !feedbacks"
        class="space-y-4"
      >
        <div
          v-for="i in 3"
          :key="`skeleton-${i}`"
          class="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950"
        >
          <USkeleton
            class="h-4 w-3/4 rounded"
          />
          <USkeleton
            class="h-3 w-full rounded"
          />
          <USkeleton
            class="h-3 w-5/6 rounded"
          />
          <USkeleton
            class="h-2 w-1/3 rounded"
          />
        </div>
      </div>

      <!-- Error State -->
      <UCard
        v-else-if="error"
        class="border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-lucide-alert-circle"
              class="h-5 w-5 text-red-600 dark:text-red-500"
            />
            <h3 class="font-semibold text-red-900 dark:text-red-200">
              Erro ao carregar feedbacks
            </h3>
          </div>
        </template>

        <p class="text-sm text-red-800 dark:text-red-300">
          {{ error.message || 'Ocorreu um erro ao buscar o histórico. Tente novamente.' }}
        </p>

        <template #footer>
          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-refresh-cw"
            @click="refreshFeedbacks"
          >
            Tentar novamente
          </UButton>
        </template>
      </UCard>

      <!-- Empty State -->
      <div
        v-else-if="!pending && filteredFeedbacks.length === 0"
        class="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-200 py-12 dark:border-gray-800"
      >
        <UIcon
          name="i-lucide-inbox"
          class="h-12 w-12 text-gray-300 dark:text-gray-700"
        />
        <div class="text-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ searchQuery ? 'Nenhum feedback encontrado' : 'Nenhum feedback registrado' }}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{
              searchQuery
                ? 'Tente ajustar sua busca'
                : 'Os feedbacks registrados aparecerão aqui'
            }}
          </p>
        </div>

        <UButton
          v-if="searchQuery"
          color="neutral"
          variant="soft"
          icon="i-lucide-x"
          @click="clearSearch"
        >
          Limpar filtro
        </UButton>
      </div>

      <!-- Feedbacks Table -->
      <div
        v-else
        class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800"
      >
        <table class="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-semibold"
              >
                ID
              </th>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-semibold"
              >
                Data e horário
              </th>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-semibold"
              >
                Tipo
              </th>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-semibold"
              >
                Região
              </th>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-semibold"
              >
                Unidade
              </th>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-semibold"
              >
                Nota
              </th>
              <th
                scope="col"
                class="min-w-72 px-4 py-3 font-semibold"
              >
                Descrição
              </th>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 text-center font-semibold"
              >
                Lida
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr
              v-for="feedback in filteredFeedbacks"
              :key="feedback.id"
              class="align-top hover:bg-gray-50 dark:hover:bg-gray-900/50"
            >
              <td class="whitespace-nowrap px-4 py-3">
                {{ feedback.id }}
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                <time :datetime="feedback.created_at">
                  {{ formatFeedbackDate(feedback.created_at) }}
                </time>
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                {{ feedback.tipo }}
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                {{ feedback.regiao }}
              </td>
              <td class="min-w-64 px-4 py-3">
                {{ feedback.unidade }}
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                {{ feedback.nota }}
              </td>
              <td class="min-w-72 whitespace-pre-wrap px-4 py-3">
                {{ feedback.descricao }}
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-center">
                <label class="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
                    :checked="readFeedbackIds.has(feedback.id)"
                    :aria-label="`${readFeedbackIds.has(feedback.id) ? 'Marcar como não lido' : 'Marcar como lido'}: feedback ${feedback.id}`"
                    @change="toggleFeedbackRead(feedback.id)"
                  >
                  <span class="sr-only">
                    {{ readFeedbackIds.has(feedback.id) ? 'Lida' : 'Não lida' }}
                  </span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UPageSection>
  </div>
</template>
