/** A producer code option for the user-assignment UI (GET /users/producer-codes). */
export interface ProducerCodeOption {
  id: number
  code: string
  holderName: string | null
  isMaster: boolean
  isActive: boolean
}
