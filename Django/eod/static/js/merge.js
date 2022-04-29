(function(){

  "use strict";

  $(document).ready(function () {

    jQuery.fn.extend({

      syncDeletion: function() {

        jQuery(this).on("submit", function (e) {

          let error = false,
              officer_id;

          $("[data-action='officer-removal']:checked").each(function (_, radio) {

            officer_id = $(radio).data("officer-id");

            $(`[data-object-id='${officer_id}']`).each(function (_, node) {
              if (!$(node).prop("checked")) {
                error = true;
              }
            });

          });

          if (error) {
            alert("Error: The Officer cannot be removed since it is used as a Primary Contact on an Address.\n\nYou must update both changes to either use OR not use the correction");
          }

          return !error;

        });

      },
    }),


    $("table.record-amendment tr.analyze-correction").each(function (idx, element) {

      let $element = $(element),
          $current = $element.find("td>[data-object=\"current\"]"),
          $corrected = $element.find("td+td>[data-object=\"corrected\"]");

      if ((typeof $current.data("value") !== "undefined") && (typeof $corrected.data("value") !== "undefined")) {

        if ($current.data("value") !== $corrected.data("value")) {
          $element.addClass("info");
        }
      }
    });

    $("table.record-addition tr.analyze-correction, table.record-removal tr.analyze-correction").each(function (idx, element) {

      let $element = $(element),
          $current = $element.find("td>[data-object=\"current\"]"),
          $corrected = $element.find("td+td>[data-object=\"corrected\"]");

      if ((typeof $current.data("value") !== "undefined") && (typeof $corrected.data("value") !== "undefined")) {
        if ($current.data("value") !== $corrected.data("value")) {
          $element.addClass("info");
        }
      }
    });

    $("form[data-object='sync-deletion']").syncDeletion();

  });

})();
