import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type RecordType } from '../data/schema'

type RecordsDialogType = 'create' | 'update' | 'delete' | 'import'

type RecordsContextType = {
  open: RecordsDialogType | null
  setOpen: (str: RecordsDialogType | null) => void
  currentRow: RecordType | null
  setCurrentRow: React.Dispatch<React.SetStateAction<RecordType | null>>
}

const RecordsContext = React.createContext<RecordsContextType | null>(null)

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<RecordsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<RecordType | null>(null)

  return (
    <RecordsContext.Provider
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </RecordsContext.Provider>
  )
}

export const useRecords = () => {
  const recordsContext = React.useContext(RecordsContext)
  if (!recordsContext) {
    throw new Error('useRecords has to be used within <RecordsProvider>')
  }
  return recordsContext
}
