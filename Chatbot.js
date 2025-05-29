const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms));

const conversas = {};
const media = MessageMedia.fromFilePath('./imagem.jpeg');

client.on('message', async msg => {
    const numero = msg.from;

    // ❌ Ignora mensagens de grupos
    if (numero.includes('@g.us')) return;

    const body = msg.body.toLowerCase();
    const contact = await msg.getContact();
    const nome = contact.pushname ? contact.pushname.split(" ")[0] : "Olá";

    if (body === 'sair' || body === 's') {
        delete conversas[numero];
        await msg.reply('👋 Atendimento finalizado! Se precisar de algo, é só mandar "oi".');
        return;
    }

    if (!conversas[numero]) {
        conversas[numero] = { etapa: 'inicio' };
        await msg.reply(
            `Olá, ${nome}! Sou o assistente virtual da Farmácia Dotti 💊\n\nSobre o que você deseja falar?\n\n` +
            `1️⃣ Promoções\n2️⃣ Orçamento\n3️⃣ Horário de atendimento\n4️⃣ Valor da taxa de entrega\n` +
            `5️⃣ Ver preço de fralda\n6️⃣ Localização da farmácia\n7️⃣ Outros assuntos\n\n` +
            `Digite *sair* a qualquer momento para encerrar.`
        );
        return;
    }

    const etapa = conversas[numero].etapa;

    if (etapa === 'inicio') {
        if (body === '1') {
            try {
                await client.sendMessage(numero, media);
                delete conversas[numero];
            } catch (err) {
                console.error('Erro ao enviar imagem:', err);
                await msg.reply('⚠️ Ocorreu um erro ao enviar as promoções. Tente novamente mais tarde.');
            }
        } else if (body === '2' || body.includes('orçamento')) {
            conversas[numero].etapa = 'orcamento_tipo';
            await msg.reply('Qual tipo de orçamento deseja?\n1. Medicamentos\n2. Perfumaria\n3. Ordem judicial');
        } else if (body === '3' || body.includes('horário')) {
            await msg.reply('⏰ *HORÁRIO DE ATENDIMENTO*\n\nSegunda a sexta:\n08h às 12h / 12h às 22h\nSábado: 08h às 22h\nDomingo: 08h às 12h e 15h às 22h');
            delete conversas[numero];
        } else if (body === '4' || body.includes('taxa')) {
            await msg.reply('🏍️ *TAXA DE ENTREGA*\nR$ 10,00 para todas as localidades');
            delete conversas[numero];
        } else if (body === '5' || body.includes('fralda')) {
            await msg.reply('*PREÇOS DE FRALDA:*\n1- Fralda 1 - R$ 19,99\n2- Fralda 2 - R$ 29,99\n3- Fralda 3 - R$ 39,99\n4- Fralda 4 - R$ 49,99\n5- Fralda 5 - R$ 59,99');
            conversas[numero].etapa = 'aguarda_atendente';
        } else if (body === '6' || body.includes('localização')) {
            await msg.reply('📍 *LOCALIZAÇÃO DA FARMÁCIA*\nAv. Brasília, 1729, Centro – Medianeira-PR\nhttps://www.google.com/maps?q=farmácia+dotti+medianeira');
            delete conversas[numero];
        } else {
            await msg.reply('Ok! Digite o que precisa e um atendente irá te responder.\nVocê pode digitar *sair* para encerrar.');
            conversas[numero].etapa = 'aguarda_atendente';
        }
        return;
    }

    if (etapa === 'orcamento_tipo') {
        if (body === '1') {
            conversas[numero].etapa = 'orcamento_medicamento';
            await msg.reply('Deseja:\n1. Enviar foto da receita\n2. Escrever os medicamentos');
        } else if (body === '2') {
            conversas[numero].etapa = 'orcamento_perfumaria';
            await msg.reply('Envie uma foto do produto ou digite o nome.');
        } else if (body === '3') {
            conversas[numero].etapa = 'orcamento_ordem_judicial';
            await msg.reply('Envie a receita ou escreva os medicamentos.\nInclua também o nome completo e CPF do solicitante.');
        } else {
            await msg.reply('Opção inválida. Por favor, escolha 1, 2 ou 3.');
        }
        return;
    }

    if (['orcamento_medicamento', 'orcamento_perfumaria', 'orcamento_ordem_judicial'].includes(etapa)) {
        await msg.reply('Certo! Agora é só aguardar, um atendente irá te responder em breve 😊');
        conversas[numero].etapa = 'aguarda_atendente';
        return;
    }

    if (etapa === 'aguarda_atendente') {
        await msg.reply('Aguarde só mais um momento, um atendente irá te responder 😉');
        return;
    }
});
