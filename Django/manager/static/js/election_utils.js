function init_field(element_selector, always_remote_required) {
    function update_ui(force_show) {
        var $checkbox = $(element_selector + '> div input[type=checkbox]')
        var $divs = $(element_selector + '> div')

        if (force_show === true) {
            $($divs[1]).show()
            $('input', $divs[1]).attr('required', true)
        } else if (force_show === false || $checkbox.is(':checked')) {
            $($divs[1]).hide()
            $('input', $divs[1]).removeAttr('required')
        } else {
            $($divs[1]).show()
            $('input', $divs[1]).attr('required', true)
        }

        if (always_remote_required) {
            $(always_remote_required).removeAttr('required')
        }
    }


    $(document).ready(function() {
        update_ui()
        $(element_selector + '> div input[type=checkbox]').click(function(el) {
            update_ui(!$(this).is(':checked'), always_remote_required)
        })
    })
}

