import _state from './state'
import _actions from './actions'

import * as Login from './Login'
import * as Map from './Map'

export const state = {
  Login: Login.state,
  Map: Map.state,
  ..._state
};
export const actions = {
  Login: Login.actions,
  Map: Map.actions,
  ..._actions
}
export const onInitialize = async ({actions}) => {
  await actions.app.onInitialize();
  await actions.view.Login.onInitialize();
}
