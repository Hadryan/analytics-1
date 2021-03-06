const { Connection } = require('amqplib-as-promised');
const { fixProtocol } = require('./utils');
// TODO: Change to process.env
const AMQP_URL = process.env.RABBITMQ_URI || 'amqp://user:test@localhost:5672/';
const queue = 'analytics';
const connection = new Connection(AMQP_URL);
let channel;

async function connect() {
  await connection.init();
  channel = await connection.createConfirmChannel();
  await channel.assertQueue(queue, { durable: true });
  return channel;
}

async function getChannel() {
  return channel;
}

async function pushToQueue(data) {
  const {
    pathname,
  } = new URL(fixProtocol(data.href));
  const stringify = JSON.stringify({ pathname, ...data });
  await channel.sendToQueue(queue, Buffer.from(stringify));
}

function sanitizeMessage(message) {
  // eslint-disable-next-line new-cap
  return JSON.parse(new Buffer.from(message.content).toString());
}

function consume(handler) {
  channel.consume(queue, (message) => {
    const data = sanitizeMessage(message);
    channel.ack(message);
    handler(data);
  })
    .then((r) => console.log('Consumer Connected', r.consumerTag));
}

module.exports = {
  connect,
  pushToQueue,
  consume,
  getChannel,
};
