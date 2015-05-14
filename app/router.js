let router = require('express').Router();
import _ from 'lodash';
import statusCodes from 'http-status-codes';

import routes from './configs/routes';

let methods = ['GET', 'POST', 'DELETE'];

class RoutesConfigError extends Error {}

let attachToRoute = ({Controller, action, path, method}) => {
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

attachRoutes(routes);

router.get('*', (req, res) => {
	res.status(404).json({'error': 'The princess is in another castle'});
});

export default router;