import { useEffect, useState } from "react"
import type { PostgrestError } from "@supabase/supabase-js"
import { supabase } from "../lib/supabaseClient"

type QueryResult<T> = {
  data: T[] | null
  error: PostgrestError | null
  loading: boolean
}

type QueryOptions = {
  columns?: string
  filters?: (query: any) => any
  realtime?: boolean
}

export function useSupabaseQuery<T = any>(
  table: string,
  options: QueryOptions = {}
) {
  const { columns = "*", filters, realtime = false } = options

  const [result, setResult] = useState<QueryResult<T>>({
    data: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      let query = supabase.from(table).select(columns)

      if (filters) {
        query = filters(query)
      }

      const { data, error } = await query

      if (isMounted) {
        setResult({
          data: (data as T[]) ?? null,
          error: error ?? null,
          loading: false,
        })
      }
    }

    fetchData()

    let channel: any
    if (realtime) {
      channel = supabase
        .channel(`public:${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            fetchData()
          }
        )
        .subscribe()
    }

    return () => {
      isMounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [table, columns, filters, realtime])

  return result
}