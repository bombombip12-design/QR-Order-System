import { createContext, useContext, useState, useCallback } from 'react'

const TableContext = createContext(null)

export function TableProvider({ children }) {
  const [tableId, setTableId] = useState(null)
  const [tableName, setTableName] = useState(null)

  const setTable = useCallback((id, name) => {
    setTableId(id)
    setTableName(name ?? null)
  }, [])

  return <TableContext.Provider value={{ tableId, tableName, setTable }}>{children}</TableContext.Provider>
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

