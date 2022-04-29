function handle_election_details(container) {
    // TODO: restore open/close state
    $(container + ' .show-details').click(function(ev) {
        var details = $(this).parents('tr').next()
        if (details.hasClass('hidden')) {
            $('.fa.fa-plus', this).removeClass('fa-plus').addClass('fa-minus')
            details.removeClass('hidden')
        } else {
            $('.fa.fa-minus', this).removeClass('fa-minus').addClass('fa-plus')
            details.addClass('hidden')
        }
        ev.preventDefault()
        return false
    })
}

// compare arrays:
var areArraysEqualByValues = function( arr1, arr2 ) {
  return  $( arr1 ).not( arr2 ).length === 0 && $( arr2 ).not( arr1 ).length === 0;
}

function get_all_selected_election_ids(container) {
    return $(container + ' .select_single_selection').filter(function(value, checkbox) {
        return $(checkbox).is(':checked')
    }).map(function(value, checkbox) {
        return $(checkbox).data('election-id')
    })
}

var __empty_state = '{"selected_elections":{}, "query": ""}'

function elections_state_clear() {
    sessionStorage.setItem('elections_state', __empty_state)
}


function elections_state_get() {
    var es = sessionStorage.getItem('elections_state')
    if (es === null || es === undefined) {
        es = __empty_state
    }
    return JSON.parse(es)
}

function elections_state_set(es) {
    sessionStorage.setItem('elections_state', JSON.stringify(es))
}

function elections_state_get_all_selected(es) {
    return Object.keys(es['selected_elections']).filter(function(election_id) {
        return es['selected_elections'][election_id] == true
    }).map(function(election_id) {
        return election_id
    })
}

function restore_select_all_elections_state(page_total_selected) {
    $('#select_all_elections').prop('checked', false)
    $('#select_all_elections').prop('indeterminate', false)
    if (page_total_selected > 0) {
        $('#select_all_elections').prop(page_total_selected == page_elections_ids.length
            ? 'checked'
            : 'indeterminate',
            true)
    }
}

function update_select_all_checkbox(container, elections_state) {
    // restore selected id
    var page_total_selected = 0
    $(container + ' .select_single_selection').map(function(value, checkbox) {
        var election_id = $(checkbox).data('election-id')
        var was_selected = elections_state['selected_elections'][election_id] === true
        $(checkbox).prop('checked', was_selected)
        if (was_selected) {
            page_total_selected++
        }
    })

    // restore all state checkbox
    restore_select_all_elections_state(page_total_selected)
}

function update_select_all(elections_state) {
    all_selected_ids = elections_state_get_all_selected(elections_state)
    if (total_elections > elections_per_page) {
        var $selectAll = $('.election-select-all')
        var $deselectAll = $('.election-deselect-all')

        if (!$selectAll.hasClass('hidden')) {
            $selectAll.addClass('hidden')
        }

        if (!$deselectAll.hasClass('hidden')) {
            $deselectAll.addClass('hidden')
        }

        if (_.difference(all_elections_ids, all_selected_ids).length == 0) {
            $deselectAll.removeClass('hidden')
        } else if (_.difference(page_elections_ids, all_selected_ids).length == 0) {
            $selectAll.removeClass('hidden')
        }
    }

    var $elem = $('.download-multiple-election-results')
    if (all_selected_ids.length > 0) {
        if ($elem.hasClass('hidden')) {
            $elem.removeClass('hidden')
        }
        $elem.attr('title', 'Download ' + all_selected_ids.length + ' selected elections')
        $elem.attr('data-election-id', all_selected_ids.join(','))
    } else {
        if (!$elem.hasClass('hidden')) {
            $elem.addClass('hidden')
        }
        $elem.attr('title', '')
        $elem.attr('data-election-id', '')
    }
}

function change_selection_state_for_all_elections(container, state) {
    elections_state = elections_state_get()

    // mark checkboxes on the current page
    $(container + ' .select_single_selection').map(function(value, checkbox) {
        $(checkbox).prop('checked', state)
    })

    // select all ids in the model
    _.each(all_elections_ids, function(election_id) {
        elections_state['selected_elections'][election_id] = state
    })

    update_select_all(elections_state)
    update_select_all_checkbox(container, elections_state)

    elections_state_set(elections_state)
}

function handle_selection(container) {

    $('.total-elections').text(total_elections)
    $('.elections-per-page').text(elections_per_page)

    elections_state = elections_state_get()

    var query = getParameterByName('query')
    if (!query) {
        query = ''
    }

    if (elections_state['query'] != query) {
        elections_state_clear()
        elections_state = elections_state_get()
        elections_state['query'] = query
    }

    update_select_all_checkbox(container, elections_state)
    update_select_all(elections_state)

    // All 50 conversations on this page are selected. [Select all 108 conversations in Inbox]
    // All 108 conversations in Inbox are selected. [Clear selection]

    $('#select_all_elections').click(function(e) {
        var is_checked = $(this).is(':checked')

        elections_state = elections_state_get()

        $(container + ' .select_single_selection').map(function(value, checkbox) {
            var election_id = $(checkbox).data('election-id')
            $(checkbox).prop('checked', is_checked)
            elections_state['selected_elections'][election_id] = is_checked
        })

        update_select_all(elections_state)

        elections_state_set(elections_state)
    })


    $(container + ' .select_single_selection').click(function(e) {
        elections_state = elections_state_get()

        var is_checked = $(this).is(':checked')
        var election_id = $(this).data('election-id')
        $(this).prop('checked', is_checked)
        elections_state['selected_elections'][election_id] = is_checked

        elections_state_set(elections_state)

        var page_total_selected = 0
        _.each(page_elections_ids, function(election_id) {
            if (elections_state['selected_elections'][election_id]) {
                page_total_selected++
            }
        })

        update_select_all(elections_state)
        restore_select_all_elections_state(page_total_selected)
    })

    $(container + ' .election-select-all-action').click(function(e) {
        change_selection_state_for_all_elections(container, true)
    })

    $(container + ' .election-deselect-all-action').click(function(e) {
        change_selection_state_for_all_elections(container, false)
    })

}

// CSRF code
function getCookie(cookieName, cookieString) {
  cookieString = cookieString || window.document.cookie;
  if (cookieString && cookieString !== '') {
    var cookies = cookieString.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim()
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, cookieName.length + 1) === cookieName + '=') {
        return decodeURIComponent(cookie.substring(cookieName.length + 1))
      }
    }
  }
  return null
}

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

$(function() {
    handle_election_details('.elections-results-container')
    handle_selection('.elections-results-container')

    $.ajaxSetup({
        crossDomain: false,
        beforeSend: function(xhr, settings) {
            var csrftoken = getCookie('csrftoken')
            if (!csrfSafeMethod(settings.type)) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken)
            }
        }
    })


    var poll_timers = {}

    function update_download_status(elem, data) {
        if (data.status == 'PENDING' || data.status == 'PROCESSING') {
            poll_timers[data.elections_ids.join(',')] = {'ticket_id': data.id}
            elem.attr('class', 'download-election-results fa fa-spinner fa-spin fa-fw')
            elem.attr('title', '')

        } else if (data.status == 'ERROR') {
            elem.attr('class', 'download-election-results fa fa-exclamation-circle')
            elem.attr('title', data.error)
            delete poll_timers[data.elections_ids.join(',')]

        } else if (data.status == 'READY') {
            elem.hide()
            elem.next().removeClass('hidden')
            elem.next().attr('href', data.url)
            delete poll_timers[data.elections_ids.join(',')]
        }
    }


    function ajax_callback(elem) {
        return function success(data) {
            update_download_status(elem, data)
            console.log('response=', data)
        }
    }

    function results_checker() {
        _.forEach(poll_timers, function(val, election_id) {

            $.ajax({
                type: "GET",
                url: ajax_check_download_link.replace('999999999', val.ticket_id),
                success: ajax_callback($("i[data-election-id='" + election_id + "']"))
            })
        })
    }


    results_checker_id = setInterval(results_checker, 1000)

    $('.download-election-results').click(function() {
        var $this = $(this)
        var elections_ids = '' + $this.data('election-id')
        if (!elections_ids) {
            return
        }

        console.log('download-election-results', elections_ids);

        $.ajax({
            type: 'POST',
            url: ajax_generate_download_link_for_elections,
            data: JSON.stringify({ 'elections_ids': elections_ids.split(',') }),
            contentType: 'application/json; charset=utf-8',
            success: ajax_callback($this)
        })
    })
})
