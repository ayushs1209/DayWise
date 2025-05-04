"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 5000 // Set a reasonable auto-dismiss delay

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId)); // Clear existing timeout if any
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
       // Clear timeouts for existing toasts when adding a new one (limit 1)
       state.toasts.forEach(t => {
        if (toastTimeouts.has(t.id)) {
          clearTimeout(toastTimeouts.get(t.id));
          toastTimeouts.delete(t.id);
        }
      });
      // Add new toast and start its timer
      addToRemoveQueue(action.toast.id);
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };


    case "UPDATE_TOAST":
      // If updating, clear and restart the timer for the specific toast
      if (action.toast.id && toastTimeouts.has(action.toast.id)) {
        clearTimeout(toastTimeouts.get(action.toast.id)!);
        addToRemoveQueue(action.toast.id);
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        if (toastTimeouts.has(toastId)) {
          clearTimeout(toastTimeouts.get(toastId)!);
          toastTimeouts.delete(toastId);
        }
        // Optionally trigger immediate removal or let REMOVE_TOAST handle it later
         dispatch({ type: "REMOVE_TOAST", toastId });
      } else {
        // Dismiss all: clear all timeouts and remove all toasts
        state.toasts.forEach((toast) => {
           if (toastTimeouts.has(toast.id)) {
            clearTimeout(toastTimeouts.get(toast.id)!);
            toastTimeouts.delete(toast.id);
          }
        })
        return { ...state, toasts: [] }; // Remove all toasts immediately
      }

      // If dismissing a specific toast, filter it out
       return {
         ...state,
         toasts: state.toasts.filter(t => t.id !== toastId),
       };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        // Ensure all timeouts are cleared if removing all toasts
         state.toasts.forEach(t => {
          if (toastTimeouts.has(t.id)) {
            clearTimeout(toastTimeouts.get(t.id)!);
            toastTimeouts.delete(t.id);
          }
        });
        return {
          ...state,
          toasts: [],
        }
      }
      // Clear timeout when removing a specific toast
       if (toastTimeouts.has(action.toastId)) {
         clearTimeout(toastTimeouts.get(action.toastId)!);
         toastTimeouts.delete(action.toastId);
       }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    default:
        return state; // Add a default case
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
           // If manually closed, remove immediately without relying on timeout
          if (toastTimeouts.has(id)) {
             clearTimeout(toastTimeouts.get(id)!);
             toastTimeouts.delete(id);
           }
          dispatch({ type: "REMOVE_TOAST", toastId: id })
        }
      },
    },
  })

  // Add to remove queue (starts auto-dismiss timer)
  addToRemoveQueue(id);

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
