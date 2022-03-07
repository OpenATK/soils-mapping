import _ from 'lodash'
export default {
  onInitialize({state, actions}) {
    actions.view.Map.zoomBounds();
  }
}
