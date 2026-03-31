import { useEffect } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useExchangeRateStore } from '../store/exchangeRateStore'
import exchangeRateApi from '../api/exchangeRateApi'

export function useExchangeRate() {
  const { rates, updatedAt, isConnected, setRates, setConnected } = useExchangeRateStore()

  useEffect(() => {
    // Initial fetch
    exchangeRateApi.getRates().then(res => {
      if (res?.data) setRates(res.data.rates, res.data.updatedAt)
    })

    // WebSocket connection
    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL),
      onConnect: () => {
        setConnected(true)
        client.subscribe('/topic/exchange-rates', (msg) => {
          const data = JSON.parse(msg.body)
          setRates(data.rates, data.updatedAt)
        })
      },
      onDisconnect: () => setConnected(false),
      reconnectDelay: 5000,
    })
    client.activate()
    return () => client.deactivate()
  }, [])

  const convert = (amount, from, to) => {
    if (!rates[from] || !rates[to]) return null
    return (amount / rates[from]) * rates[to]
  }

  return { rates, updatedAt, isConnected, convert }
}
