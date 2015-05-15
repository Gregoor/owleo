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
            let SubController = Controller ||
                require(`./controllers/${key}-controller`);
            attachRoutes(value, SubController, path.concat(key));
        }
    }
};

let attachToRoute = ({Controller, action, path, method}) => {
	let joinedPath = '/' + path.join('/');
	if (!Controller) {
		throw new RoutesConfigError(`Missing controller for path: ${joinedPath}.`);
	}

	router.route(joinedPath)[method.toLowerCase()]((req, res) => {
		try {
			let {query} = req;
			let params = query.json ? JSON.parse(query.json) : req.body || req.params;

			let ctrl = new Controller({params, req});

            if (ctrl.before) ctrl.before(action).then((allowed) => {
                if (allowed) callCtrl(ctrl, action, req, res);
                else respondWith(res, statusCodes.UNAUTHORIZED);
            }).catch(handleError.bind(null, res));
            else callCtrl(ctrl, action, req, res);
		} catch(error) {
            handleError(res, error);
			//if ('dev') {
			//	let {message, stack} = error;
			//	res.json({message, 'stack': stack.split('\n')});
			//	throw error;
			//}
		}
	});
};

let callCtrl = (ctrl, action, req, res) => {
    return ctrl[action](req.params.id).then(data => {
        respondWith(res, data);
    }).catch(handleError.bind(null, res));
};

let respondWith = (res, data) => {
    let body, status;
    if (_.isObject(data)) {
        body = data.body;
        status = data.status;
    } else if (_.isNumber(data)) status = data;

    if (!body) body = data;

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