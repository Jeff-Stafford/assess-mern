function handle_delete(container, form, id) {
    $(container).on('click', form + '-instance .btn-delete', function() {
        $(this).parent().parent().remove();
        var count = $(container + ' ' + form).length
        $(id + '-TOTAL_FORMS').attr('value', count)
    })
}

function handle_add(container, form, template, id) {
    $(container + ' .btn-add').click(function(ev) {
        ev.preventDefault();
        var count = $(container + ' ' + form).length;
        var tmplMarkup = $(template).html();
        var compiledTmpl = tmplMarkup.replace(/__prefix__/g, count);
        $(container).append(compiledTmpl);

        // update form count
        $(id + '-TOTAL_FORMS').attr('value', count + 1);

        // some animate to scroll to view our new form
        // $('html, body').animate({
        //         scrollTop: $("#add-item-button").position().top-200
        //     }, 800);
        return false;
    })
}

function handle_election_details(container) {
    $(container + '.show_details').click(function(ev) {
        e.preventDefault()
        var details = $(this).parent().next()
        if (details.hasClass('hidden')) {
            details.removeClass('hidden')
        } else {
            details.addClass('hidden')
        }
        return false
    })
}


$(function() {
    // add new attachment
    handle_add('.attachment-results-container', '.attachment-form', '#attachment-form-template', '#id_attachment')

    // delete attachmnt
    handle_delete('.attachment-results-container', '.attachment-form', '#id_attachment')

    handle_election_details('.attachment-results-container')

})
