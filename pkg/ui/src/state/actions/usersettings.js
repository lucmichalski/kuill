export var types = {}
for (let type of [
  'SELECT_NAMESPACES',
]) {
  types[type] = `usersettings.${type}`
}

export function selectNamespaces(namespaces) {
  return {
    type: types.SELECT_NAMESPACES,
    namespaces: namespaces,
  }
}