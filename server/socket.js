let io;

const setIo = (socketIo) => {
  io = socketIo;
};

module.exports = {
  setIo,
  get io() { return io; }
};