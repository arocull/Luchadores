import Host from './Host';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const Server = new Host(PORT);
Server.initialize();
