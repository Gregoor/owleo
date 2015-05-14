let router = require('express').Router();
import _ from 'lodash';
import statusCodes from 'http-status-codes';

import routes from './routes';

let methods = ['GET', 'POST', 'DELETE'];

class RoutesConfigError extends Error {}

let attachToRoute = (Controller, action, path, method) => {
	let joinedPath = '/' + path.join('/');
	if (!Controller) {
		throw new RoutesConfigError(`Missing controller for path: ${joinedPath}.`);
	}

	router.route(joinedPath)[method.toLowerCase()]((req, res) => {
		try {
			let {query} = req;
			let params = query.json ? JSON.parse(query.json) : req.body || req.params;
			let ctrl = new Controller();
            _.assign(ctrl, {params, 'user': req.user});
			ctrl[action](req.params.id).then(data => {
				let {body, status} = data;
                if (_.isNumber(data)) status = data;
				else if (!body) body = data;

				if (status !== undefined) res.status(status);
                if (body === undefined) {
                    let resp = statusCodes.getStatusText(status);
                    if (status >= 400) {
                        resp = {'error': resp};
                    }
                    res.json(resp);
                } else res.json(body);
			}).catch(error => {
                console.error(error);
            });
		} catch(error) {
			res.status(statusCodes.INTERNAL_SERVER_ERROR);
            res.end();
			console.error(error);
			//if ('dev') {
			//	let {message, stack} = error;
			//	res.json({message, 'stack': stack.split('\n')});
			//	throw error;
			//}
		}
	});
};

let attachRoutes = (routes, Controller, path = []) => {
	for (let [pathOrMethod, routesOrAction] of Object.entries(routes)) {
		if (_.includes(methods, pathOrMethod)) {
			attachToRoute(Controller, routesOrAction, path, pathOrMethod);
		} else {
			let SubController = Controller ||
				require(`./controllers/${pathOrMethod}-controller`);
			attachRoutes(routesOrAction, SubController, path.concat(pathOrMethod));
		}
	}
};

attachRoutes(routes);

router.get('*', (req, res) => {
	res.status(404).json({'error': 'The princess is in another castle'});
});

export default router;