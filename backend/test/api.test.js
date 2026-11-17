const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');

process.env.DATABASE_URL ||= 'postgresql://test:test@127.0.0.1:5432/test';

const app = require('../src/app');
const productosRepository = require('../src/models/productoRepository');
const transaccionesRepository = require('../src/models/transaccionRepository');

const originalProductMethods = { ...productosRepository };
const originalTransactionMethods = { ...transaccionesRepository };
let server;
let baseUrl;
let createdProducts;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  Object.assign(productosRepository, originalProductMethods);
  Object.assign(transaccionesRepository, originalTransactionMethods);
});

test('GET /api/productos returns the repository data', async () => {
  productosRepository.obtenerTodos = async () => [
    { id: 1, nombre: 'Teclado', categoria: 'Electronica', pvp: 59.99 }
  ];

  const response = await fetch(`${baseUrl}/api/productos`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'success',
    data: [{ id: 1, nombre: 'Teclado', categoria: 'Electronica', pvp: 59.99 }]
  });
});

test('POST /api/productos rejects invalid input without writing', async () => {
  createdProducts = 0;
  productosRepository.crear = async () => { createdProducts += 1; };

  const response = await fetch(`${baseUrl}/api/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Teclado', categoria: 'Electronica', pvp: 0 })
  });

  assert.equal(response.status, 400);
  assert.equal(createdProducts, 0);
});

test('POST /api/productos sanitizes and creates valid input', async () => {
  productosRepository.crear = async (product) => ({ id: 2, ...product });

  const response = await fetch(`${baseUrl}/api/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: '<b>Teclado</b>', categoria: 'Electronica', pvp: '59.99' })
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.data.nombre, 'Teclado');
  assert.equal(body.data.pvp, 59.99);
});

test('GET /api/transacciones returns the repository data', async () => {
  transaccionesRepository.obtenerPagina = async () => ({ total: 0, data: [] });

  const response = await fetch(`${baseUrl}/api/transacciones`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'success',
    page: 1,
    perPage: transaccionesRepository.PAGE_SIZE,
    total: 0,
    totalPages: 0,
    data: []
  });
});

test('unknown routes return a JSON 404 response', async () => {
  const response = await fetch(`${baseUrl}/api/no-existe`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    status: 'error',
    message: 'Ruta no encontrada.'
  });
});