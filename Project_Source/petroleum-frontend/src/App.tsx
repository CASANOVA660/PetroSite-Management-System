import { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';

const App = (): ReactElement => {
  return (
    <Provider store={store}>
      <Outlet />
    </Provider>
  );
};

export default App;
