import { parseAsString, createLoader } from 'nuqs/server'

export const usersSearchParams = {
  sort: parseAsString.withDefault(''),
  order: parseAsString.withDefault('asc'),
}

export const loadUsersSearchParams = createLoader(usersSearchParams)
