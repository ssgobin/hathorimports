/**
 * Rotas de Pagamento - Mercado Pago
 * Hathor Imports
 */

import express from "express";
import {
  createPaymentPreference,
  getPaymentInfo,
  validateWebhookNotification,
  processWebhookNotification,
} from "../mercadopago-config.js";
import { getFirestore } from "../firebase-admin.js";

const router = express.Router();
const db = getFirestore();

/**
 * POST /api/payment/create-preference
 * Criar preferência de pagamento
 */
router.post("/create-preference", async (req, res) => {
  try {
    const { items, customer, shipping, externalReference } = req.body;

    console.log(
      "🔍 Dados recebidos:",
      JSON.stringify({ items, customer, shipping }, null, 2)
    );

    // Validar dados obrigatórios
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Items são obrigatórios",
      });
    }

    if (!customer || !customer.email) {
      return res.status(400).json({
        success: false,
        error: "Dados do cliente são obrigatórios",
      });
    }

    // Preparar dados para o Mercado Pago
    const orderData = {
      items: items.map((item) => ({
        id: item.id || `item-${Date.now()}`,
        title: item.name || item.title,
        description: item.description || "",
        image: item.image || "",
        quantity: item.quantity || 1,
        price: Number(item.price),
      })),

      payer: {
        name: customer.name,
        email: customer.email,
        phone: customer.whatsapp
          ? {
              areaCode: customer.whatsapp.substring(0, 2),
              number: customer.whatsapp.substring(2),
            }
          : undefined,
        address: shipping
          ? {
              zipCode: shipping.cep,
              street: shipping.street,
              number: shipping.number,
            }
          : undefined,
      },

      backUrls: {
        success: `${req.protocol}://${req.get("host")}/payment-success.html`,
        failure: `${req.protocol}://${req.get("host")}/payment-failure.html`,
        pending: `${req.protocol}://${req.get("host")}/payment-pending.html`,
      },

      externalReference: externalReference || `ORDER-${Date.now()}`,

      notificationUrl: `${req.protocol}://${req.get(
        "host"
      )}/api/payment/webhook`,
    };

    // Criar preferência
    const preference = await createPaymentPreference(orderData);

    // Salvar dados temporários do pedido (será convertido em pedido real após pagamento)
    try {
      const total = items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
      );

      const pendingOrderDoc = {
        orderId: orderData.externalReference,
        preferenceId: preference.preferenceId,
        status: "awaiting_payment",
        customer: {
          name: customer.name || "",
          email: customer.email || "",
          whatsapp: customer.whatsapp || "",
          phone: customer.whatsapp || "",
        },
        shipping: {
          cep: shipping?.cep || "",
          street: shipping?.street || "",
          number: shipping?.number || "",
          complement: shipping?.complement || "",
          district: shipping?.district || "",
          city: shipping?.city || "",
          state: shipping?.state || "",
        },
        items: items.map((item) => ({
          id: item.id || "",
          name: item.name || item.title || "",
          title: item.name || item.title || "",
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
          image: item.image || "",
          description: item.description || "",
        })),
        total: total,
        totalFormatted: `R$ ${total.toFixed(2)}`,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        metadata: {
          userAgent: req.get("user-agent"),
          ip: req.ip,
        },
      };

      console.log(
        "💾 Salvando pedido pendente (aguardando pagamento):",
        orderData.externalReference
      );
      await db
        .collection("pending_orders")
        .doc(orderData.externalReference)
        .set(pendingOrderDoc);
      console.log(
        "✅ Pedido pendente salvo. Será convertido em pedido real após confirmação de pagamento."
      );
    } catch (firebaseError) {
      console.error("⚠️  Erro ao salvar pedido pendente:", firebaseError);
      // Não falha a requisição se o Firebase der erro
    }

    const response = {
      success: true,
      preferenceId: preference.preferenceId,
      initPoint: preference.initPoint,
      sandboxInitPoint: preference.sandboxInitPoint,
      orderId: orderData.externalReference,
    };

    console.log(
      "📤 Resposta enviada ao frontend:",
      JSON.stringify(response, null, 2)
    );
    res.json(response);
  } catch (error) {
    console.error("❌ Erro ao criar preferência:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/payment/:paymentId
 * Buscar informações de um pagamento
 */
router.get("/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: "Payment ID é obrigatório",
      });
    }

    const paymentInfo = await getPaymentInfo(paymentId);

    res.json(paymentInfo);
  } catch (error) {
    console.error("❌ Erro ao buscar pagamento:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/payment/webhook
 * Receber notificações do Mercado Pago
 */
router.post("/webhook", async (req, res) => {
  try {
    console.log("📬 Webhook recebido:", req.body);

    const notification = req.body;

    // Validar notificação básica
    if (!validateWebhookNotification(notification)) {
      console.warn("⚠️  Notificação inválida recebida");
      // Mesmo assim retorna 200 para não receber novamente
      return res.status(200).json({
        success: false,
        error: "Notificação inválida",
      });
    }

    // Processar notificação (não propaga erros)
    const result = await processWebhookNotification(notification);

    // Criar pedido real quando pagamento for aprovado
    if (result.success && result.paymentInfo) {
      const paymentStatus = result.paymentInfo.status;
      const externalReference = result.paymentInfo.externalReference;

      console.log(`💳 Status do pagamento: ${paymentStatus}`);
      console.log(`📦 External Reference: ${externalReference}`);

      // Se pagamento aprovado, converter pedido pendente em pedido real
      if (paymentStatus === "approved" && externalReference) {
        try {
          // Buscar pedido pendente
          const pendingOrderRef = db
            .collection("pending_orders")
            .doc(externalReference);
          const pendingOrderSnap = await pendingOrderRef.get();

          if (pendingOrderSnap.exists) {
            const pendingOrder = pendingOrderSnap.data();

            // Criar pedido real
            const realOrder = {
              ...pendingOrder,
              status: "approved",
              paymentStatus: "approved",
              paymentId: result.paymentId,
              paymentMethod: result.paymentInfo.paymentMethod || "Mercado Pago",
              approvedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Salvar na coleção de pedidos reais
            await db.collection("orders").doc(externalReference).set(realOrder);
            console.log("✅ Pedido real criado:", externalReference);

            // Remover da coleção de pendentes
            await pendingOrderRef.delete();
            console.log("🗑️  Pedido pendente removido");

            // Aqui você pode adicionar:
            // - Enviar email de confirmação
            // - Notificar o cliente via WhatsApp
            // - Atualizar estoque
          } else {
            console.warn(
              "⚠️  Pedido pendente não encontrado:",
              externalReference
            );
          }
        } catch (error) {
          console.error("❌ Erro ao criar pedido real:", error);
        }
      } else if (
        paymentStatus === "rejected" ||
        paymentStatus === "cancelled"
      ) {
        // Se pagamento rejeitado/cancelado, apenas atualizar status do pendente
        try {
          const pendingOrderRef = db
            .collection("pending_orders")
            .doc(externalReference);
          await pendingOrderRef.update({
            status: paymentStatus,
            updatedAt: new Date().toISOString(),
          });
          console.log(`⚠️  Pedido pendente atualizado para: ${paymentStatus}`);
        } catch (error) {
          console.error("❌ Erro ao atualizar pedido pendente:", error);
        }
      }
    }

    if (result.success) {
      console.log("✅ Notificação processada com sucesso:", result);
    } else {
      console.warn("⚠️  Notificação processada com avisos:", result);
    }

    // Sempre retornar 200 para o Mercado Pago
    res.status(200).json({
      success: true,
      message: "Notificação recebida e processada",
    });
  } catch (error) {
    console.error("❌ Erro crítico ao processar webhook:", error);

    // Mesmo com erro crítico, retornar 200 para evitar reenvios infinitos
    res.status(200).json({
      success: false,
      error: "Erro processado internamente",
      message: "Webhook recebido mas com erro no processamento",
    });
  }
});

/**
 * GET /api/payment/config/public-key
 * Retornar public key para o frontend
 */
router.get("/config/public-key", (req, res) => {
  res.json({
    success: true,
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || "",
  });
});

export default router;
