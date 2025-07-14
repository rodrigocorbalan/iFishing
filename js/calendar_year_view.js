// js/calendar_year_view.js

// Importe showLoading e hideLoading se não forem globais ou se ui.js não for carregado antes
// Para garantir a independência, vou incluir aqui uma versão básica.
function showLoading() {
    document.getElementById('loader')?.classList.remove('hidden');
}
function hideLoading() {
    document.getElementById('loader')?.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', initYearCalendar);

async function initYearCalendar() {
    console.log("--- INICIANDO DEBUG CALENDÁRIO ANUAL ---");
    const calendarEl = document.getElementById('year-calendar');
    const loaderEl = document.getElementById('year-calendar-loading');

    if (!calendarEl || !loaderEl) {
        console.error("DEBUG: Elementos do calendário anual não encontrados.");
        return;
    }

    loaderEl.classList.remove('hidden'); // Mostra o loader específico do calendário anual

    let events = [];
    try {
        // Busca os dados das visitas usando a função central do api.js
        const visitas = await getAllVisitas(); // Assume que getAllVisitas() está disponível via api.js
        if (visitas.error) {
            throw new Error(visitas.error);
        }
        events = formatVisitsForYearCalendar(visitas);
        console.log("DEBUG: Eventos para calendário anual formatados.", events);
    } catch (error) {
        console.error("ERRO FATAL NO CALENDÁRIO ANUAL:", error);
        loaderEl.textContent = `Erro ao carregar o calendário anual: ${error.message}. Verifique a planilha e o script.`;
        return;
    } finally {
        loaderEl.classList.add('hidden'); // Esconde o loader específico do calendário anual
    }

    // Garante que o container do calendário está visível (se estava hidden inicialmente)
    calendarEl.style.visibility = 'visible'; // ou remova 'hidden' do CSS se tiver

    const calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'pt-br',
        initialView: 'dayGridMonth', // Visão inicial por mês, mas vamos personalizar
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'prevYear,nextYear' // Adiciona botões para navegar ano a ano
        },
        views: {
            dayGridMonth: { // Customiza a visão padrão para mostrar o ano inteiro
                dayMaxEvents: true, // Permite "mais" link para dias com muitos eventos
                duration: { years: 1 }, // Tenta mostrar 1 ano de uma vez (pode ser ajustado)
                fixedWeekCount: false, // Não força um número fixo de semanas por mês
                // ATENÇÃO: FullCalendar não tem uma "year view" nativa como grid de meses.
                // Esta configuração tentará mostrar o ano inteiro se houver espaço,
                // mas geralmente renderiza mês a mês.
                // Para uma visão real "grid de meses", seria necessário um plugin ou customização mais profunda.
                // Vamos tentar uma abordagem que exiba muitos meses lado a lado.
            }
        },
        events: events,
        eventClick: function(info) {
            // Ação ao clicar em um evento no calendário
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
    console.log("--- FIM DO DEBUG CALENDÁRIO ANUAL ---");
}

/**
 * Formata os dados das visitas para o formato que o FullCalendar entende.
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