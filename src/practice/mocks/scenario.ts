let failNextSave = false

export function armSaveFailure() {
  failNextSave = true
}

export function consumeSaveFailure(): boolean {
  const shouldFail = failNextSave
  failNextSave = false
  return shouldFail
}
