(function(){

  "use strict";

  $(document).ready(function() {
    $(document).on('click', 'a.download-ready', function(e) {
      e.preventDefault();
      var self = $(this);
      $.fileDownload(self.prop('href'))
        .done(function () {
          // console.log('done', url)
        })
        .fail(function (error) {
          // console.log('fail', url, error)
          self.parent().html(error);
        });

      return false;
    });

    // $('.export-state').each(function(_, el) {
    //   var state_id = $(el).data('state-id');
    //   var $status = $(el).next();
    // });

    $('.export-state').click(function(e) {
      e.preventDefault();

      function update_status($element, $status, status_url, intervalCancelId) {
        $.get(status_url).done(function(status) {
          if (status.task_status === 'PROGRESS') {
            $element.find('progress').attr({'value': status.current, 'max': status.total}).text((status.current/status.total*100).toFixed(2) + '%');
          } else if (status.task_status === 'FAILURE') {
            var error = 'Internal Error';
            if (status.error) {
              error = 'Error: ' + status.error;
            }
            $status.find('.download-error').attr('title', error).removeClass('hidden');
            clearInterval(intervalCancelId);
          } else if (status.task_status === 'SUCCESS') {
            clearInterval(intervalCancelId);
            $status.find('.download-ready').attr('href', status.download_url).removeClass('hidden');
          }

          if (status.task_status === 'SUCCESS' || status.task_status === 'FAILURE') {
            $element.addClass('hidden');
            $element.find('.exporting').addClass('hidden');
          }
        });
      }

      (function($element, export_url, $status) {

        $element.find('.export-all').addClass('hidden');
        $element.find('.exporting').removeClass('hidden');

        $.get(export_url)
          .done(function(data) {
            var intervalCancelId = setInterval(function(status_url) {
              update_status($element, $status, status_url, intervalCancelId);
            }, 1000, data.task_status_url);
          })
          .fail(function() {
            // console.log('error=', error)
          });

      })($(this), $(this).prop('href'), $(this).next());

      return false;
    });
  });
})();
