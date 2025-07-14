// js/calendar_year_view.js

/**
 * Inicializa o FullCalendar na div #year-calendar com os eventos fornecidos.
 * @param {Array} visitas - Um array de objetos de visita, já carregado da API.
 */
function initYearCalendar(visitas) {
    console.log("--- INICIANDO CALENDÁRIO ANUAL (VERSÃO MENSAL) ---");
    const calendarEl = document.getElementById('year-calendar');
    const loaderEl = document.getElementById('year-calendar-loading');

    if (!calendarEl || !loaderEl) {
        console.error("DEBUG: Elementos do calendário anual não encontrados.");
        return;
    }

    const events = formatVisitsForYearCalendar(visitas);
    console.log("DEBUG: Eventos para calendário anual formatados.", events);

    loaderEl.classList.add('hidden');
    calendarEl.style.visibility = 'visible';

    setTimeout(() => {
        try {
            const calendar = new FullCalendar.Calendar(calendarEl, {
                locale: 'pt-br',

                // --- VOLTANDO PARA A VISÃO MENSAL ---
                initialView: 'dayGridMonth', // Voltamos para a visão de um mês.
                headerToolbar: {
                    left: 'prev,next today', // Botões para navegar entre meses.
                    center: 'title',         // Mostra o mês e ano atuais.
                    right: 'dayGridMonth,listYear' // Opções de visualização.
                },
                // --- FIM DA ALTERAÇÃO ---

                events: events,
                eventClick: function(info) {
                    const detalhes = `Pesqueiro: ${info.event.title}\n` +
                                     `Data: ${info.event.start.toLocaleDateString('pt-BR')}\n` +
                                     `Peixes: ${info.event.extendedProps.peixes || 'Não registrado.'}\n` +
                                     `Obs: ${info.event.extendedProps.observacoes || 'Nenhuma.'}`;
                    alert(detalhes);
                },
                eventDidMount: function(info) {
                    info.el.title = `Clique para ver detalhes da visita ao ${info.event.title}`;
                }
            });

            calendar.render();
            console.log("--- CALENDÁRIO ANUAL RENDERIZADO COM SUCESSO ---");

        } catch (e) {
            console.error("ERRO CRÍTICO AO RENDERIZAR O FULLCALENDAR:", e);
            loaderEl.classList.remove('hidden');
            loaderEl.textContent = `Erro ao renderizar o calendário: ${e.message}`;
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
        return {
            title: visita.PesqueiroNome || 'Visita sem nome',
            start: visita.DataVisita,
            allDay: true,
            extendedProps: {
                observacoes: visita.Observacoes,
                peixes: visita.PeixesCapturados
            }
        };
    });
}