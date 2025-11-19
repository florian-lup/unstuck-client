import React from 'react'
import { DEFAULT_GAMES } from './defaultGames'

export interface Game {
  id: string
  gameName: string
  displayName: string
  version?: string
  icon?: React.ReactNode
  category?: 'survival' | 'moba' | 'strategy' | 'rpg' | 'mmorpg' | 'souls-like'
  isActive?: boolean
  isCustom?: boolean // Track if this is a user-added game
}

// Local storage key
const GAMES_STORAGE_KEY = 'unstuck-games-library'

// Local Storage Management
export const loadGamesFromStorage = (): Game[] => {
  try {
    const stored = localStorage.getItem(GAMES_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as Game[]
    }
  } catch {
    // Silently fall back to default games
  }
  // Return default games if nothing in storage
  return DEFAULT_GAMES
}

export const saveGamesToStorage = (games: Game[]): void => {
  try {
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(games))
  } catch {
    // Silently fail if storage is unavailable
  }
}

// Get current games (from storage or defaults)
export const getGames = (): Game[] => {
  return loadGamesFromStorage()
}

// Add a new custom game
export const addCustomGame = (
  displayName: string,
  version = '',
  category?: Game['category']
): Game => {
  const games = getGames()

  // Generate ID from display name
  const id = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const newGame: Game = {
    id: `custom-${id}-${Date.now()}`, // Add timestamp to ensure uniqueness
    gameName: displayName.toLowerCase(),
    displayName,
    version,
    category: category ?? 'rpg',
    isActive: true,
    isCustom: true,
  }

  // Add new game at the beginning of the array
  const updatedGames = [newGame, ...games]
  saveGamesToStorage(updatedGames)

  return newGame
}

// Delete a game (custom or default)
export const deleteGame = (gameId: string): void => {
  const games = getGames()
  const updatedGames = games.filter((game) => game.id !== gameId)
  saveGamesToStorage(updatedGames)
}

// Update a game
export const updateGame = (gameId: string, updates: Partial<Game>): void => {
  const games = getGames()
  const updatedGames = games.map((game) =>
    game.id === gameId ? { ...game, ...updates } : game
  )
  saveGamesToStorage(updatedGames)
}

// Reset to default games
export const resetToDefaultGames = (): void => {
  saveGamesToStorage(DEFAULT_GAMES)
}

// Utility functions for game management
export const getActiveGames = (): Game[] => {
  return getGames().filter((game) => game.isActive)
}

export const getGameById = (id: string): Game | undefined => {
  return getGames().find((game) => game.id === id)
}

export const getGamesByCategory = (category: Game['category']): Game[] => {
  return getGames().filter(
    (game) => game.category === category && game.isActive
  )
}

export const searchGames = (query: string): Game[] => {
  const lowercaseQuery = query.toLowerCase()
  return getGames().filter(
    (game) =>
      game.isActive &&
      (game.gameName.toLowerCase().includes(lowercaseQuery) ||
        game.displayName.toLowerCase().includes(lowercaseQuery) ||
        game.version?.toLowerCase().includes(lowercaseQuery))
  )
}

export const getGameDisplayNameWithVersion = (game: Game): string => {
  return game.version
    ? `${game.displayName} (${game.version})`
    : game.displayName
}

// Initialize storage with defaults if empty
if (typeof window !== 'undefined' && !localStorage.getItem(GAMES_STORAGE_KEY)) {
  saveGamesToStorage(DEFAULT_GAMES)
}

// Default export for convenience
export default getGames()
