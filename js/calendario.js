document.addEventListener('DOMContentLoaded', async function() {
    const calendarEl = document.getElementById('calendar');

    // Busca os dados das visitas
    const visitas = await getAllVisitas();
    const eventos = formatarVisitasParaCalendario(visitas);

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        events: eventos,
        eventClick: function(info) {
            // Aqui você pode adicionar a lógica para o que acontece ao clicar em um evento
            // Por exemplo, abrir um modal com os detalhes da visita
            alert('Pesqueiro: ' + info.event.title + '\n' +
                  'Observações: ' + info.event.extendedProps.observacoes);
        }
    });

    calendar.render();
});

/**
 * Busca todas as visitas de todos os pesqueiros.
 * Esta função precisa ser adicionada ao seu api.js
 */
async function getAllVisitas() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=readAllVisitas`);
        if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Falha ao buscar todas as visitas:", error);
        return [];
    }
}

/**
 * Formata os dados das visitas para o formato que o FullCalendar entende.
 */
function formatarVisitasParaCalendario(visitas) {
    return visitas.map(visita => {
        return {
            title: visita.PesqueiroNome, // Assumindo que o nome do pesqueiro virá da API
            start: visita.DataVisita,
            allDay: true,
            extendedProps: {
                observacoes: visita.Observacoes
            }
        };
    });
}