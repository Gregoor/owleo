import {useRouterHistory} from 'react-router';
import {createHistory} from 'history'

export default useRouterHistory(createHistory)({queryKey: false});
