import tree from './tree';
import config from '../../config'
import Promise from 'bluebird'
import _ from 'lodash'

export default {
  async connect({actions, state, effects}, {domain, token}) {
    const myState = state.OADAManager;
    const myActions = actions.OADAManager;
    if (token) myState.token = token;
//    token = await myActions.getToken(domain);
    console.log('another thing', token, domain);
    console.log(actions.oada.connect);
    return actions.oada.connect({
      token,
      domain: domain,
      options: config.OPTIONS,
      cache: false,
      concurrency: 1,
    }).then((response) => {
      console.log({response});
      if (!response.error) {
        myState.currentConnection = response.connectionId;
        myState.token = response.token;
        myState.connected = true;
        //Unselect local opeation
      }
      return response;
    })
  },
  async logout({actions, state}) {
    const myState = state.OADAManager;
    const {currentConnection: connection_id} = myState;
    delete myState.token;
    await actions.oada.disconnect({connection_id})
  },
  async getUserInfo({actions, state}) {
    const myState = state.OADAManager;
    const {currentConnection: connection_id} = myState;
    let requests = [{
      path: '/users/me',
    }];
    await actions.oada.get({requests, connection_id})
  },
  async fetchAndWatch({actions, state}) {
    const myState = state.OADAManager;
    const {currentConnection: connection_id} = myState;
    //Fetch field and seasons
    let watchRequests = [
      {
        path: '/bookmarks/fields',
        tree,
        watch: {
          actions: [actions.OADAManager.onFieldChanged]
        }
      },
      {
        path: '/bookmarks/seasons',
        tree,
        watch: {
          actions: []
        },
      }
    ];
    const ret = await actions.oada.get({requests: watchRequests, connection_id})
    let rewatchRequests = [];
    if (ret.responses[0].error) {
      //On 404 create and rewatch
      if (ret.responses[0].status !== 404) throw ret.responses[0].error;
      //Create fields and try to watch again
      let requests = [{
        tree,
        data: {
          fields: {},
          farms: {}
        },
        path: '/bookmarks/fields'
      }];
      //Create
      await actions.oada.put({requests, connection_id})
      //Rewatch
      rewatchRequests.push(watchRequests[0]);
    }
    if (ret.responses[1].error) {
      //On 404 create and rewatch
      if (ret.responses[1].status !== 404) throw ret.responses[0].error;
      //Create seasons and try to watch again
      let requests = [{
        tree,
        data: {},
        path: '/bookmarks/seasons'
      }];
      //Create
      await actions.oada.put({requests, connection_id})
      //Rewatch
      rewatchRequests.push(watchRequests[1]);
    }
    if (rewatchRequests.length > 0) await actions.oada.get({requests: rewatchRequests, connection_id})
  },
  async login({actions, state}, {domain, token}) {
    const myState = state.OADAManager;
    const myActions = actions.OADAManager;
    myState.domain = domain;
    console.log('thing', domain, token);
    token = 'def'
    const {error} = await myActions.connect({domain, token});
    console.log({error});
    if (!error) {
      await myActions.getUserInfo();
      await actions.soils.initialize();
      await actions.view.Map.zoomBounds();
    }
  },
}
