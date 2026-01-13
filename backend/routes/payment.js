/**
 * Rotas de Pagamento - Mercado Pago
 * Hathor Imports
 */

import express from 'express';
import {
  createPaymentPreference,
  getPaymentInfo,
  validateWebhookNotification,
  processWebhookNotification
} from '../mercadopago-config.js';

const router = express.Router();

/**
 * POST /api/payment/create-preference
 * Criar preferência de pagamento
 */
router.post('/create-preference', async (req, res) => {
  try {
    const {
      items,
      customer,
      shipping,
      externalReference
    } = req.body;

    // Validar dados obrigatórios
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items são obrigatórios'
      });
    }

    if (!customer || !customer.email) {
      return res.status(400).json({
        success: false,
        error: 'Dados do cliente são obrigatórios'
      });
    }

    // Preparar dados para o Mercado Pago
    const orderData = {
      items: items.map(item => ({
        id: item.id || `item-${Date.now()}`,
        title: item.name || item.title,
        description: item.description || '',
        image: item.image || '',
        quantity: item.quantity || 1,
        price: Number(item.price)
      })),

      payer: {
        name: customer.name,
        email: customer.email,
        phone: customer.whatsapp ? {
          areaCode: customer.whatsapp.substring(0, 2),
          number: customer.whatsapp.substring(2)
        } : undefined,
        address: shipping ? {
          zipCode: shipping.cep,
          street: shipping.street,
          number: shipping.number
        } : undefined
      },

      backUrls: {
        success: `${req.protocol}://${req.get('host')}/payment-success.html`,
        failure: `${req.protocol}://${req.get('host')}/payment-failure.html`,
        pending: `${req.protocol}://${req.get('host')}/payment-pending.html`
      },

      externalReference: externalReference || `ORDER-${Date.now()}`,
      
      notificationUrl: `${req.protocol}://${req.get('host')}/api/payment/webhook`
    };

    // Criar preferência
    const preference = await createPaymentPreference(orderData);

    res.json({
      success: true,
      preferenceId: preference.preferenceId,
      initPoint: preference.initPoint,
      sandboxInitPoint: preference.sandboxInitPoint
    });

  } catch (error) {
    console.error('❌ Erro ao criar preferência:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/payment/:paymentId
 * Buscar informações de um pagamento
 */
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID é obrigatório'
      });
    }

    const paymentInfo = await getPaymentInfo(paymentId);

    res.json(paymentInfo);

  } catch (error) {
    console.error('❌ Erro ao buscar pagamento:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/payment/webhook
 * Receber notificações do Mercado Pago
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('📬 Webhook recebido:', req.body);

    const notification = req.body;

    // Validar notificação básica
    if (!validateWebhookNotification(notification)) {
      console.warn('⚠️  Notificação inválida recebida');
      // Mesmo assim retorna 200 para não receber novamente
      return res.status(200).json({
        success: false,
        error: 'Notificação inválida'
      });
    }

    // Processar notificação (não propaga erros)
    const result = await processWebhookNotification(notification);

    // Aqui você pode adicionar lógica adicional:
    // - Atualizar status do pedido no Firebase
    // - Enviar email de confirmação
    // - Notificar o cliente via WhatsApp
    // - Atualizar estoque

    if (result.success) {
      console.log('✅ Notificação processada com sucesso:', result);
    } else {
      console.warn('⚠️  Notificação processada com avisos:', result);
    }

    // Sempre retornar 200 para o Mercado Pago
    res.status(200).json({
      success: true,
      message: 'Notificação recebida e processada'
    });

  } catch (error) {
    console.error('❌ Erro crítico ao processar webhook:', error);
    
    // Mesmo com erro crítico, retornar 200 para evitar reenvios infinitos
    res.status(200).json({
      success: false,
      error: 'Erro processado internamente',
      message: 'Webhook recebido mas com erro no processamento'
    });
  }
});

/**
 * GET /api/payment/config/public-key
 * Retornar public key para o frontend
 */
router.get('/config/public-key', (req, res) => {
  res.json({
    success: true,
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || ''
  });
});

export default router;

// Made with Bob