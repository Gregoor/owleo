let router = require('express').Router();
import _ from 'lodash';
import statusCodes from 'http-status-codes';

import routes from './configs/routes';

let methods = ['GET', 'POST', 'DELETE'];

class RoutesConfigError extends Error {}

let attachRoutes = (routes, Controller, path = []) => {
    for (let [key, value] of Object.entries(routes)) {
        if (_.includes(methods, key)) {
            attachToRoute({
                Controller, 'action': value,
                path, 'method': key
            });
        } else if (!_.isObject(value)) {
            attachToRoute({
                Controller, 'action': key,
                'path': path.concat(key), 'method': value
            });
        } else {
            let newCtrl = false;
            if (key[0] == '#') {
                key = key.slice(1);
                newCtrl = true;
            }
            let SubController = newCtrl || !Controller ?
                require(`./controllers/${key}-controller`) :
                Controller;
            attachRoutes(value, SubController, path.concat(key));
        }
    }
};

let attachToRoute = ({Controller, action, path, method}) => {
	let joinedPath = '/' + path.join('/');
    let paramNames = _(path)
        .filter(p => p[0] == ':')
        .map(p => p.slice(1))
        .value();
	if (!Controller) {
		throw new RoutesConfigError(`Missing controller for: ${joinedPath}.`);
	}

	router.route(joinedPath)[method.toLowerCase()]((req, res) => {
		try {
			let {query} = req;
			let params = query.json ?
                JSON.parse(query.json) :
                _.assign({}, req.body, req.params, query);

			let ctrl = new Controller({params, req});
            let callCtrlCurried =
                callCtrl.bind(this, ctrl, action, req, res, paramNames);

            if (ctrl.before) ctrl.before(action).then((allowed) => {
                if (allowed) callCtrlCurried();
                else respondWith(res, statusCodes.UNAUTHORIZED);
            }).catch(handleError.bind(null, res));
            else callCtrlCurried();
		} catch(error) {
            handleError(res, error);
		}
	});
};

let callCtrl = (ctrl, action, req, res, paramNames) => {
    return ctrl[action](...paramNames.map(n => req.params[n])).then(data => {
        respondWith(res, data);
    }).catch(handleError.bind(null, res));
};

let respondWith = (res, data) => {
    let body, status;
    if (_.isObject(data) && data.body && data.status) {
        body = data.body;
        status = data.status;
    } else if (_.isNumber(data)) status = data;
    else body = data;

    if (status !== undefined) res.status(status);
    if (body === undefined) {
        let resp = statusCodes.getStatusText(status);
        if (status >= 400) {
            resp = {'error': resp};
        }
        res.json(resp);
    } else res.json(body);
};

let handleError = (res, error) => {
    respondWith(res, statusCodes.INTERNAL_SERVER_ERROR);
    error.stack.split('\n').forEach(l => console.error(l));
};

attachRoutes(routes);

router.get('*', (req, res) => {
	res.status(404).json({'error': 'The princess is in another castle'});
});

export default router;