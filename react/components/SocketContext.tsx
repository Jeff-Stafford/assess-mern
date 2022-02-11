import { FC, createContext, useContext } from 'react';
import { Socket } from 'socket.io-client';
import { socket } from '../utils/socket';

const Context = createContext({} as typeof Socket);

export const SocketProvider: FC = props => {
	if (!process.browser) return null;
	return <Context.Provider value={socket} {...props} />;
};

export const useSocket = () => useContext(Context);
