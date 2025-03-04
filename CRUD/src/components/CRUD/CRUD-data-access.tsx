'use client'

import { getCRUDProgram, getCRUDProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useCRUDProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getCRUDProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getCRUDProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['CRUD', 'all', { cluster }],
    queryFn: () => program.account.CRUD.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['CRUD', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ CRUD: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useCRUDProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useCRUDProgram()

  const accountQuery = useQuery({
    queryKey: ['CRUD', 'fetch', { cluster, account }],
    queryFn: () => program.account.CRUD.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['CRUD', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ CRUD: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['CRUD', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ CRUD: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['CRUD', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ CRUD: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['CRUD', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ CRUD: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
