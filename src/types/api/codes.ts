/** How a code depends on its parent: Triunfo's organizer of its policies, or the organization's master code. */
export type CodeLinkSource = 'triunfo' | 'organization'

export interface CodeOrganization {
  id: number
  name: string
}

export interface CodeSummary {
  code: string
  holderName: string | null
  organizations: CodeOrganization[]
  directDependents: number
  dependentCount: number
  isRoot: boolean
}

export interface CodeNode {
  code: string
  holderName: string | null
  sources: CodeLinkSource[]
  policies: number | null
  organizations: Array<CodeOrganization & { isActive: boolean }>
  repeated: boolean
  children: CodeNode[]
}

export interface CodeTree {
  code: string
  holderName: string | null
  organizations: Array<CodeOrganization & { isActive: boolean; isMaster: boolean }>
  masterOf: CodeOrganization[]
  parents: Array<{ code: string; holderName: string | null; sources: CodeLinkSource[] }>
  policies: number
  dependents: CodeNode[]
  dependentCount: number
}
