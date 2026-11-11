interface Feedback {
  id: number
  tipo: string
  regiao: string
  unidade: string
  nota: number
  descricao: string
  nome: string | null
  telefone: string | null
}

const validateFeedback = (obj: unknown): obj is Feedback => {
  if (typeof obj !== 'object' || obj === null) return false
  const feedback = obj as Record<string, unknown>
  return (
    typeof feedback.id === 'number'
    && typeof feedback.tipo === 'string'
    && typeof feedback.regiao === 'string'
    && typeof feedback.unidade === 'string'
    && typeof feedback.nota === 'number'
    && typeof feedback.descricao === 'string'
    && (typeof feedback.nome === 'string' || feedback.nome === null)
    && (typeof feedback.telefone === 'string' || feedback.telefone === null)
  )
}

export default defineEventHandler(async (event): Promise<Feedback[]> => {
  try {
    const db = event.context.cloudflare?.env?.DB

    let validFeedbacks: Feedback[]

    if (!db) {
      console.warn('D1 binding not configured - usando dados mock para desenvolvimento')
      const mockData: Feedback[] = [
        {
          id: 6,
          tipo: 'informacao',
          regiao: 'SEDE',
          unidade: 'CENTRO MUNICIPAL DE SAÚDE',
          nota: 10,
          descricao: 'Interface muito intuitiva e fácil de usar',
          nome: null,
          telefone: null
        },
        {
          id: 5,
          tipo: 'reclamacao',
          regiao: 'SEDE',
          unidade: 'CENTRO MUNICIPAL DE SAÚDE',
          nota: 6,
          descricao: 'Gostaria de mais opções de filtro',
          nome: null,
          telefone: null
        },
        {
          id: 4,
          tipo: 'informacao',
          regiao: 'SEDE',
          unidade: 'CENTRO MUNICIPAL DE SAÚDE',
          nota: 10,
          descricao: 'Performance excelente, carrega muito rápido',
          nome: null,
          telefone: null
        },
        {
          id: 3,
          tipo: 'sugestao',
          regiao: 'SEDE',
          unidade: 'CENTRO MUNICIPAL DE SAÚDE',
          nota: 8,
          descricao: 'Alguns botões poderiam ser maiores',
          nome: null,
          telefone: null
        },
        {
          id: 2,
          tipo: 'elogio',
          regiao: 'SEDE',
          unidade: 'CENTRO MUNICIPAL DE SAÚDE',
          nota: 10,
          descricao: 'Excelente suporte técnico',
          nome: null,
          telefone: null
        },
        {
          id: 1,
          tipo: 'informacao',
          regiao: 'SEDE',
          unidade: 'CENTRO MUNICIPAL DE SAÚDE',
          nota: 9,
          descricao: 'Layout responsivo funciona bem em mobile',
          nome: null,
          telefone: null
        }
      ]
      validFeedbacks = mockData
    } else {
      const statement = db.prepare(
        'SELECT id, tipo, regiao, unidade, nota, descricao, nome, telefone FROM feedbacks ORDER BY id DESC LIMIT 1000'
      )
      const result = await statement.all()

      if (!Array.isArray(result.results)) {
        throw new Error('Invalid database response format')
      }

      validFeedbacks = result.results.filter(validateFeedback)
      if (validFeedbacks.length !== result.results.length) {
        throw new Error('D1 returned rows with an unexpected feedback schema')
      }
    }

    setResponseHeader(event, 'Cache-Control', 'no-store')
    setResponseHeader(event, 'Content-Type', 'application/json')

    return validFeedbacks
  } catch (error) {
    console.error('Erro ao buscar histórico de feedbacks:', error instanceof Error ? error.message : 'Unknown error')

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Falha ao buscar histórico de feedbacks'
    })
  }
})
