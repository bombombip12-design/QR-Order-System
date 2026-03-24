import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type TableContextType = {
  tableId: string | null
  tableName: string | null
  setTable: (id: string | null, name?: string | null) => void
}

const TableContext = createContext<TableContextType | null>(null)

export function TableProvider({ children }: { children: ReactNode }) {
  const [tableId, setTableId] = useState<string | null>(null)
  const [tableName, setTableName] = useState<string | null>(null)
  const setTable = useCallback((id: string | null, name?: string | null) => {
    setTableId(id)
    setTableName(name ?? null)
  }, [])
  return (
    <TableContext.Provider value={{ tableId, tableName, setTable }}>
      {children}
    </TableContext.Provider>
  )
}

export function useTableId() {
  const ctx = useContext(TableContext)
  return ctx?.tableId ?? null
}

export function useTableName() {
  const ctx = useContext(TableContext)
  return ctx?.tableName ?? null
}

export function useSetTable() {
  const ctx = useContext(TableContext)
  return ctx?.setTable ?? (() => {})
}
