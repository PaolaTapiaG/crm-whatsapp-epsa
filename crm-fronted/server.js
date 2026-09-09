
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.SIMULATOR_PORT || 3000;
const LARAVEL_URL = process.env.LARAVEL_URL || 'http://localhost:8001';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Enviar mensaje al backend Laravel
app.post('/api/send-message', async (req, res) => {
  try {
    const { phoneNumber, message, sessionId } = req.body;
    
    console.log(`📱 Mensaje de ${phoneNumber}: ${message}`);
    console.log(`🔗 Enviando a Laravel: ${LARAVEL_URL}`);

    const response = await axios.post(`${LARAVEL_URL}/api/v1/whatsapp/webhook`, {
      from: phoneNumber,
      text: message,
      session_id: sessionId,
      message_type: 'text'
    });

    console.log('✅ Respuesta de Laravel:', response.data);

    const result = response.data?.data ?? response.data;

    if (result?.success === false) {
      res.status(500).json({
        success: false,
        error: result.error || result.response || 'Laravel no pudo procesar el mensaje',
      });
      return;
    }

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error comunicándose con el backend',
      details: error.message
    });
  }
});

// Verificar estado
app.get('/api/health', async (req, res) => {
  try {
    const response = await axios.get(`${LARAVEL_URL}/api/v1/whatsapp/status`);
    res.json({
      success: true,
      backend: 'connected',
      data: response.data
    });
  } catch (error) {
    res.json({
      success: false,
      backend: 'disconnected',
      error: error.message
    });
  }
});

const dashboardRoutes = [
  'stats',
  'recent-messages',
  'top-intents',
  'ia-status',
];

['clients', 'conversations', 'tickets'].forEach((resource) => {
  app.get(`/api/admin/${resource}`, async (req, res) => {
    try {
      const response = await axios.get(`${LARAVEL_URL}/api/v1/${resource}`, { params: req.query });
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 502).json({
        success: false,
        error: error.response?.data?.message || 'No se pudo consultar el recurso',
      });
    }
  });
});

app.get('/api/admin/intents', async (req, res) => {
  try {
    const response = await axios.get(`${LARAVEL_URL}/api/v1/intents`, { params: req.query });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json({ success: false, error: 'No se pudieron consultar las intenciones' });
  }
});

app.get('/api/admin/conversations/:id/messages', async (req, res) => {
  try {
    const response = await axios.get(`${LARAVEL_URL}/api/v1/conversations/${req.params.id}/messages`, { params: req.query });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json({ success: false, error: 'No se pudo cargar la conversación' });
  }
});

app.post('/api/admin/conversations/:id/:action', async (req, res) => {
  const allowedActions = ['close', 'transfer'];
  if (!allowedActions.includes(req.params.action)) return res.status(404).json({ success: false, error: 'Acción no disponible' });
  try {
    const response = await axios.post(`${LARAVEL_URL}/api/v1/conversations/${req.params.id}/${req.params.action}`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json({ success: false, error: 'No se pudo actualizar la conversación' });
  }
});

app.get('/api/operator/pending', async (req, res) => {
  try {
    const response = await axios.get(`${LARAVEL_URL}/api/v1/operator/pending`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json({ success: false, error: 'No se pudieron cargar las conversaciones pendientes' });
  }
});

app.get('/api/operator/conversation/:id/messages', async (req, res) => {
  try {
    const response = await axios.get(`${LARAVEL_URL}/api/v1/operator/conversation/${req.params.id}/messages`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json({ success: false, error: 'No se pudieron cargar los mensajes' });
  }
});

app.post('/api/operator/send-message', async (req, res) => {
  try {
    const response = await axios.post(`${LARAVEL_URL}/api/v1/operator/send-message`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json(error.response?.data || { success: false, error: 'No se pudo enviar el mensaje' });
  }
});

app.post('/api/operator/conversation/:id/qr', async (req, res) => {
  try {
    const response = await axios.post(`${LARAVEL_URL}/api/v1/operator/conversation/${req.params.id}/qr`, req, { headers: { ...req.headers, 'content-type': req.headers['content-type'] } });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json(error.response?.data || { success: false, error: 'No se pudo enviar el QR' });
  }
});

app.patch('/api/operator/payment/:id', async (req, res) => {
  try {
    const response = await axios.patch(`${LARAVEL_URL}/api/v1/operator/payment/${req.params.id}`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json(error.response?.data || { success: false, error: 'No se pudo actualizar el comprobante' });
  }
});

app.post('/api/operator/conversation/:id/invoice', async (req, res) => {
  try {
    const response = await axios.post(`${LARAVEL_URL}/api/v1/operator/conversation/${req.params.id}/invoice`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json(error.response?.data || { success: false, error: 'No se pudo enviar la factura' });
  }
});

dashboardRoutes.forEach((route) => {
  app.get(`/api/dashboard/${route}`, async (req, res) => {
    try {
      const response = await axios.get(`${LARAVEL_URL}/api/v1/dashboard/${route}`, {
        params: req.query,
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 502).json({
        success: false,
        error: error.response?.data?.error || 'No se pudo consultar el dashboard',
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Simulador corriendo en http://localhost:${PORT}`);
  console.log(`🔗 Conectado a Laravel: ${LARAVEL_URL}`);
});
