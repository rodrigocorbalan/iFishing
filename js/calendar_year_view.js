// js/calendar_year_view.js

/**
 * Inicializa o FullCalendar na div #year-calendar com os eventos fornecidos.
 * @param {Array} visitas - Um array de objetos de visita, já carregado da API.
 */
function initYearCalendar(visitas) {
    console.log("--- INICIANDO CALENDÁRIO COM VISÃO DE LISTA AGRUPADA POR MÊS ---");
    const calendarEl = document.getElementById('year-calendar');
    const loaderEl = document.getElementById('year-calendar-loading');

    if (!calendarEl || !loaderEl) {
        console.error("DEBUG: Elementos do calendário não encontrados.");
        return;
    }

    if (calendarEl.fullCalendar) {
        calendarEl.fullCalendar('destroy');
    }

    // Ordena as visitas por data para garantir que o agrupamento funcione corretamente
    const visitasOrdenadas = visitas.sort((a, b) => new Date(a.DataVisita) - new Date(b.DataVisita));
    const events = formatVisitsForYearCalendar(visitasOrdenadas);

    if (loaderEl) loaderEl.classList.add('hidden');
    calendarEl.style.visibility = 'visible';

    let ultimoMesRenderizado = null; // Variável para controlar o agrupamento

    setTimeout(() => {
        try {
            const calendar = new FullCalendar.Calendar(calendarEl, {
                locale: 'pt-br',

                // --- NOVA CONFIGURAÇÃO COM LISTA AGRUPADA POR MÊS ---

                // 1. Define a visão de lista anual como PADRÃO
                initialView: 'listYear',

                // 2. Configura o cabeçalho
                headerToolbar: {
                    left: 'prevYear,nextYear today', // Navega ano a ano
                    center: 'title',                 // Mostra o ano
                    right: 'listYear,visaoTrimestral'  // Botões para alternar: Lista Anual e Visão Trimestral
                },
                
                // 3. Define a visão trimestral (mantemos como opção)
                views: {
                  visaoTrimestral: {
                    type: 'dayGrid',
                    duration: { months: 3 },
                    buttonText: 'Trimestre'
                  }
                },

                // --- FIM DA NOVA CONFIGURAÇÃO ---

                events: events,

                // Formata como a data de cada item da lista aparece
                listDayFormat: {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                    year: 'numeric'
                },
                noEventsText: 'Nenhuma visita registrada para este período',

                // 4. LÓGICA PARA INSERIR OS CABEÇALHOS DOS MESES
                eventDidMount: function(info) {
                    const mesDoEvento = info.event.start.toLocaleString('pt-br', { month: 'long' }).toUpperCase();
                    if (mesDoEvento !== ultimoMesRenderizado) {
                        // Cria um novo cabeçalho de mês
                        const header = document.createElement('div');
                        header.className = 'month-header-list'; // Classe para o estilo
                        header.textContent = mesDoEvento;

                        // Insere o cabeçalho antes do item da lista
                        info.el.parentNode.insertBefore(header, info.el);
                        
                        ultimoMesRenderizado = mesDoEvento;
                    }
                },
                
                eventClick: function(info) {
                    const detalhes = `Pesqueiro: ${info.event.title}\n` +
                                    `Data: ${info.event.start.toLocaleDateString('pt-BR')}\n` +
                                    `Peixes: ${info.event.extendedProps.peixes || 'Não registrado.'}\n` +
                                    `Observações: ${info.event.extendedProps.observacoes || 'Nenhuma.'}`;
                    alert(detalhes);
                }
            });

            calendar.render();
            console.log("--- CALENDÁRIO COM LISTA AGRUPADA RENDERIZADO ---");

        } catch (e) {
            console.error("ERRO CRÍTICO AO RENDERIZAR O FULLCALENDAR:", e);
            if (loaderEl) {
                loaderEl.classList.remove('hidden');
                loaderEl.textContent = `Erro ao renderizar o calendário: ${e.message}`;
            }
        }
    }, 0);
}

/**
 * Formata os dados das visitas para o formato que o FullCalendar entende.
 * @param {Array} visitas - O array de objetos de visita.
 * @returns {Array} Um array de eventos para o FullCalendar.
 */
function formatVisitsForYearCalendar(visitas) {
    if (!visitas || !Array.isArray(visitas)) {
        return [];
    }
    return visitas.map(visita => {
        const pesqueiro = todosOsPesqueiros.find(p => p.ID == visita.PesqueiroID);
        const pesqueiroNome = pesqueiro ? pesqueiro.NomePesqueiro : 'Visita';
        return {
            title: pesqueiroNome,
            start: visita.DataVisita,
            allDay: true,
            extendedProps: {
                observacoes: visita.Observacoes,
                peixes: visita.PeixesCapturados
            }
        };
    });
}