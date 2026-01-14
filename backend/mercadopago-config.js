/**
 * Configuração do Mercado Pago
 * Hathor Imports
 */

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

// Validar variáveis de ambiente
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.warn("⚠️  MERCADOPAGO_ACCESS_TOKEN não configurado no .env");
}

// Inicializar cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
  options: {
    timeout: 5000,
    idempotencyKey: "hathor-imports",
  },
});

// Instâncias dos serviços
const preference = new Preference(client);
const payment = new Payment(client);

/**
 * Criar preferência de pagamento
 * @param {Object} orderData - Dados do pedido
 * @returns {Promise<Object>} - Preferência criada
 */
export async function createPaymentPreference(orderData) {
  try {
    const { items, payer, backUrls, externalReference, notificationUrl } =
      orderData;

    // Debug: verificar o que está chegando
    console.log(
      "🔍 Debug - orderData recebido:",
      JSON.stringify(orderData, null, 2)
    );
    console.log("🔍 Debug - backUrls:", backUrls);

    const preferenceData = {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || "",
        picture_url: item.image || "",
        category_id: "fashion",
        quantity: item.quantity,
        unit_price: Number(item.price),
        currency_id: "BRL",
      })),

      payer: {
        name: payer.name,
        email: payer.email,
        phone: {
          area_code: payer.phone?.areaCode || "",
          number: payer.phone?.number || "",
        },
        address: {
          zip_code: payer.address?.zipCode || "",
          street_name: payer.address?.street || "",
          street_number: payer.address?.number || "",
        },
      },

      back_urls: {
        success:
          backUrls?.success ||
          process.env.MERCADOPAGO_SUCCESS_URL ||
          "http://localhost:4000/payment-success.html",
        failure:
          backUrls?.failure ||
          process.env.MERCADOPAGO_FAILURE_URL ||
          "http://localhost:4000/payment-failure.html",
        pending:
          backUrls?.pending ||
          process.env.MERCADOPAGO_PENDING_URL ||
          "http://localhost:4000/payment-pending.html",
      },

      // Removido auto_return para funcionar com localhost
      // Em produção com HTTPS, adicionar: auto_return: "approved"

      external_reference: externalReference || `ORDER-${Date.now()}`,

      notification_url:
        notificationUrl || `${process.env.BACKEND_URL}/api/payment/webhook`,

      statement_descriptor: "HATHOR IMPORTS",

      payment_methods: {
        // Não excluir nenhum método de pagamento
        excluded_payment_methods: [],
        excluded_payment_types: [],
        // Permitir parcelamento em até 12x
        installments: 12,
        default_installments: 1,
        // Métodos aceitos: credit_card, debit_card, ticket (boleto), bank_transfer (PIX)
        // Deixar vazio para aceitar todos
      },

      // Configurações adicionais para aceitar mais métodos
      binary_mode: false, // Permite pagamentos pendentes (boleto, PIX)

      shipments: {
        cost: 0,
        mode: "not_specified",
      },

      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(), // 24 horas
    };

    const response = await preference.create({ body: preferenceData });

    console.log("✅ Preferência de pagamento criada:", response.id);

    return {
      success: true,
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
    };
  } catch (error) {
    console.error("❌ Erro ao criar preferência:", error);
    throw new Error(`Erro ao criar preferência de pagamento: ${error.message}`);
  }
}

/**
 * Buscar informações de um pagamento
 * @param {string} paymentId - ID do pagamento
 * @returns {Promise<Object>} - Dados do pagamento
 */
export async function getPaymentInfo(paymentId) {
  try {
    const paymentInfo = await payment.get({ id: paymentId });

    return {
      success: true,
      payment: {
        id: paymentInfo.id,
        status: paymentInfo.status,
        statusDetail: paymentInfo.status_detail,
        transactionAmount: paymentInfo.transaction_amount,
        dateCreated: paymentInfo.date_created,
        dateApproved: paymentInfo.date_approved,
        paymentMethod: paymentInfo.payment_method_id,
        paymentType: paymentInfo.payment_type_id,
        externalReference: paymentInfo.external_reference,
        payer: {
          email: paymentInfo.payer?.email,
          identification: paymentInfo.payer?.identification,
        },
      },
    };
  } catch (error) {
    console.error("❌ Erro ao buscar pagamento:", error);
    throw new Error(
      `Erro ao buscar informações do pagamento: ${error.message}`
    );
  }
}

/**
 * Validar notificação do webhook
 * @param {Object} notification - Dados da notificação
 * @returns {boolean} - Se a notificação é válida
 */
export function validateWebhookNotification(notification) {
  // Implementar validação de assinatura se necessário
  // Por enquanto, apenas verifica se tem os campos necessários
  return notification && notification.type && notification.data;
}

/**
 * Processar notificação do webhook
 * @param {Object} notification - Dados da notificação
 * @returns {Promise<Object>} - Resultado do processamento
 */
export async function processWebhookNotification(notification) {
  try {
    const { type, data, action } = notification;

    console.log(
      `📬 Notificação recebida - Tipo: ${type}, Ação: ${action || "N/A"}`
    );

    // Processar apenas notificações de pagamento
    if (type === "payment") {
      const paymentId = data.id;

      try {
        const paymentInfo = await getPaymentInfo(paymentId);

        console.log(
          `💳 Status do pagamento ${paymentId}: ${paymentInfo.payment.status}`
        );

        return {
          success: true,
          paymentId,
          status: paymentInfo.payment.status,
          paymentInfo: paymentInfo.payment,
        };
      } catch (paymentError) {
        // Se o pagamento não for encontrado (comum em testes), apenas loga e continua
        if (
          paymentError.message.includes("not found") ||
          paymentError.message.includes("404")
        ) {
          console.warn(
            `⚠️  Pagamento ${paymentId} não encontrado (pode ser um teste ou pagamento antigo)`
          );

          return {
            success: true,
            paymentId,
            status: "not_found",
            message: "Pagamento não encontrado - provavelmente um teste",
          };
        }

        // Se for outro erro, propaga
        throw paymentError;
      }
    }

    return {
      success: true,
      message: `Notificação processada (tipo: ${type})`,
    };
  } catch (error) {
    console.error("❌ Erro ao processar notificação:", error);

    // Não propaga o erro para evitar reenvios do Mercado Pago
    return {
      success: false,
      error: error.message,
      message: "Erro processado internamente",
    };
  }
}
