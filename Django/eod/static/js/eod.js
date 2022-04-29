(function() {

  'use strict';


  $("select[data-action='change-region']").on("change", function () {
    window.location = $(this).val();
  });


  $(document).on("click", "[data-object='remove-entity']", function (e) {
    $(document).trigger("eod.remove-entity", {"type": "officer", "multiple": "officers", "target": e.target});
    return false;
  });

  $(document).on("eod.remove-entity", function (e, data) {
    if (confirm(`Are you sure you want to remove this entry?`)) {

      let $wrapper = $(data.target).parents("[data-object='wrapper']"),
          container = $wrapper.parents(`div.${data.multiple}-container`),
          $deleted_flag = $wrapper.find("input").filter(function() { return this.id.match(/DELETE/); } ),
          $deleted = $wrapper.find("input[type='hidden']").filter(function() { return this.name.match(/id/); } ),
          count = $(container).find("[data-object='wrapper']").length;

      if ($deleted.val().match(/nid/)) {
        // this is used when there is no object persisted in the database.
        $(`#id_${data.type}-TOTAL_FORMS`).attr('value', count - 1);
        $(`option[value="${$deleted.val()}"]`).remove();
        $wrapper.remove();
      } else {
        $wrapper.find("input, select").prop("required", false);
        $wrapper.find("input, select").removeAttr("pattern");
        $wrapper.find("input, select").removeAttr("data-required");
        $wrapper.addClass("hidden");
        $deleted_flag.val('Y');
        $wrapper.find("input").attr("required", false);
        $(`option[value="${$deleted.val()}"]`).remove();
      }
    }
  });


  $(document).on("click", "[data-object='add-officer']", function () {
    $(document).trigger("eod.add-entity", {"type": "officer", "multiple": "officers"});
    document.querySelectorAll('input[name*="phone"]').forEach(function(e) { IMask(e, { mask: '(000) 000-0000 x00000 ' }); })
    document.querySelectorAll('input[name*="fax"]').forEach(function(e) { IMask(e, { mask: '(000) 000-0000 ' }); })
    return false;
  });


  $(document).on("click", "[data-object='add-address']", function () {
    $(document).trigger("eod.add-entity", {"type": "address", "multiple": "addresses"});
    document.querySelectorAll('input[name*="phone"]').forEach(function(e) { IMask(e, { mask: '(000) 000-0000 x00000 ' }); })
    document.querySelectorAll('input[name*="fax"]').forEach(function(e) { IMask(e, { mask: '(000) 000-0000 ' }); })
    return false;
  });

  $("[data-object='requestUpdates']").click(function() {
      $('html, body').animate({
          scrollTop: $(".submit-update").offset().top-300
      }, 800);
  });

  $(document).on("eod.add-entity", function (e, data) {

    let container = $(`div.${data.multiple}-container`),
        template = $(`#${data.type}-template`),
        count = $(container).find("[data-object='wrapper']").length + 1,
        tmplMarkup = $(template).html(),
        compiledTmpl = tmplMarkup.replace(/__prefix__/g, count-1),
        id = `id_${data.type}`;

    compiledTmpl = compiledTmpl.replace(/__count__/g, count);

    $(container).find(".dragable, .nondragable").append(compiledTmpl);
    $(`#${id}-TOTAL_FORMS`).attr('value', count);
    $(`#${id}-${count-1}-order_number`).attr('value', count);

    //scroll to view newly added input fields
    var scrollTarget = `${id}-${count-1}`;

    $('html, body').animate({
      scrollTop: $(`div[data-object='${scrollTarget}']`).offset().top-220
    });

    if (data.type === "address") {
      setTimeout(updateDropDowns($(`div[data-object='${scrollTarget}']`)), 0);
    }

    if (data.type === "officer") {
      let target = $(`div[data-object='${scrollTarget}']`),
          new_id = target.find("input[name='id']").val();
      target.find("input").filter(function() { return this.name.match(/nonpersistedid/); } ).val(new_id);
    }

    observeRequired();
  });


  function getContacts() {
    return $("[data-object='wrapper']").not(".hidden").find("div.officer-form-instance").map(function (index, element) {
      return {
        value: $(element).find("input").filter(function() { return this.name.match(/id/); } ).val(),
        text: $(element).find("input").filter(function() { return this.name.match(/office_name/); } ).val(),
      };
    });
  }

  function updateDropDowns(_scope) {

    let scope;
    if (typeof _scope === "undefined") {
      scope = $(document);
    } else {
      scope = _scope;
    }

    let drop_downs = scope.find("select").filter(function() {
      return (this.name.match(/primary_contact$/) || this.name.match(/additional_contacts$/));
    }).each(function (index, drop_down) {
      $(drop_down).html("");
      $(drop_down).append($('<option>', {
        value: "",
        text: "None"
      }));
      $.each(getContacts(), function (index, contact) {
        $(drop_down).append($('<option>', {
          value: contact.value,
          text: contact.text
        }));
      });
    });

  }

  $(document).on("blur", "input", function (event) {

    let name = $(event.target).attr("name").split("-").pop(),
        _this = this;

    if (name === "office_name") {

      let $wrapper = $(this).parents("[data-object='wrapper']"),
          deleted = $wrapper.find("input[type='hidden']").filter(function() { return this.name.match(/id/); } ),

          obj = {
            "name": name,
            "id": deleted.val(),
            "value": $(_this).val(),
          }

      $(document).trigger("officer-name-changed", obj);
    }

  });

  $(document).on("officer-name-changed", function(event, data) {

    let drop_downs = $("select").filter(function() {
      return (this.name.match(/primary_contact$/) || this.name.match(/additional_contacts$/));
    });

    $.each(drop_downs, function (index, element) {

      let select = $(`select[name='${$(element).attr("name")}']`),
          options = $(`select[name='${$(element).attr("name")}']` + ` option[value='${data.id}']`);

      if (options.length === 0) {
        select.append([$('<option>', {
          value: data.id,
          text: data.value
        })]);
      } else {
        $(options[0]).text(data.value);
      }
    });

  });

  $(function() {

    $(document).on("officers-done", function () {
      window.setTimeout(function () {
        let $wrappers = $(".officers-container").find("[data-object='wrapper']");
        $.each($wrappers, function (index, element) {
          $(element).find("input").filter(function() { return this.name.match(/order_number/); } ).val(`${index+1}`);
        });
      }, 0);
    });

    $("ul.dragable").sortable(
      {
        axis: "y",
        stop: function () {
          $(document).trigger("officers-done");
        }
      }
    ).disableSelection();

    $("html").on('click', "[data-object='add-new-contact']", function () {

      var $parent = $(this).parent().parent().parent(),
          count = $parent.find("[data-object='additional-contacts-pane']>.form-group").length+1,
          target = $(this).data("target");

      if (getContacts().length > count) {

        var tmplMarkup = $(`[data-object='address-primary-contact-template']`).html(),
            compiledTmpl = tmplMarkup.replace(/__prefix__/g, target);

        $parent.find("[data-object='additional-contacts-pane']").append(compiledTmpl);
        observeRequired();
        updateDropDowns($parent.find("[data-object='additional-contacts-pane'] div.form-group").last());
      }
    });


    $("html").on('click', "[data-object='remove-contact']", function () {
      var count = $(this).parents(".address-form-instance").find("[data-object='additional-contacts-pane']>.form-group").length;

      $(this).parents(".address-form-instance").find("[data-object='additional-contact-total']").val(count-1);
      $(this).parents("div.form-group").remove();
    });


    $(document).on("redraw", function () {
      observeRequired();
    });

    $(document).trigger("redraw");

  });

  function observeRequired() {

    // fields for LO address
    $("input").filter(function() { return this.id.match(/address_to/); } ).prop("required", "true");
    $("input").filter(function() { return this.id.match(/street1$/); } ).prop("required", "true");
    $("input").filter(function() { return this.id.match(/city$/); } ).prop("required", "true");
    $("input").filter(function() { return this.id.match(/zip$/); } ).prop("required", "true");
    $("select").filter(function() { return this.id.match(/state$/); } ).prop("required", "true");
    $("select").filter(function() { return this.name.match(/additional_contacts$/); } ).prop("required", "true");
    $("select").filter(function() { return this.name.match(/is_physical$/); } ).prop("required", "true");
    $("select").filter(function() { return this.name.match(/is_regular_mail$/); } ).prop("required", "true");

    // fields for LO contacts
    $("input").filter(function() { return this.id.match(/office_name$/); } ).prop("required", "true");
    $("input").filter(function() { return this.id.match(/phone$/); } ).prop("required", "true");

    $("[data-required='yes'], input[required]").each(function (index, element) {
      $(element).parents("div.form-group").find("label").addClass("requiredFieldMark");
    });
  }


  $(".toggleField").on("click", function() {
    $(this).parents('.form-group').next('.hiddenField').toggleClass('hidden');
  });

  $(document).ready(function () {

    $("[data-confirm]").on("click", function () {
      let confirm_message = $(this).data("confirm");
      if (confirm(confirm_message)) {
        $(document).trigger($(this).data("ok-action"), $(this));
      } else {
        return false;
      }
    });

    $(document).on("send-snapshot-to-officer", function (e, ...args) {
      let trigger = $(args.pop());
      trigger.attr("disabled", "disabled");
      $.ajax({
        type: "POST",
        url: trigger.data("ok-action-url"),
        complete: function (xhr, status) {
          let response_message = xhr.responseJSON.message;
          trigger.attr("title", response_message);
          if (status === "success") {
            trigger.find("span").removeClass("glyphicon-send").toggleClass("glyphicon-ok");
          } else {
            trigger.find("span").removeClass("glyphicon-send").toggleClass("glyphicon-exclamation-sign");
          }
          alert(response_message);
        },
        dataType: "json"
      });
    });

    $(document).on("submit", "form[data-object='ajax-submittable']", function () {
      return false;
    });
  /*
    $("[data-object='error-monitorable'] form").monitorForErrors(function (node_name) {

      if ((typeof node_name === "undefined") || node_name.length === 0) {
        return true;
      } else {
        $("div[data-object='form-errors-holder']").removeClass("hidden");
        $( `[name="${node_name}"]`).closest('.checkbox').toggleClass( "has-error" );
        $('.functions-header').toggleClass( "has-error" );
        $('html, body').animate({
          scrollTop: $(`[name="${node_name}"]`).parent().offset().top-350
        }, 0);
        $(`[name="${node_name}"]`).focus();
        return false;
      }
    });
  */

  });

  // Reject All Button checks "do not update option"
  $("[name='reject-correction']").on("click", function () {
    $('[value="reject"]').prop("checked", true);
  });

  //scroll to fields that do not pass validation

  var delay = 0;
  var offset = 300;

  document.addEventListener('invalid', function(e){
     $(e.target).addClass("invalid");
     $('html, body').animate({scrollTop: $($(".invalid")[0]).offset().top - offset }, delay);
  }, true);
  document.addEventListener('change', function(e){
     $(e.target).removeClass("invalid")
  }, true);

  $("[data-object='correction-submitter']").on("click", function () {

    $(this).parents("form").find("input").filter('[required]').each(function (_, element) {
      if ($(element).val().length == 0) {
        $(element).parents("div.panel-body").find("a[data-object='see-more'][aria-expanded='false']").trigger("click");
      }
    });

  });

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('input[name*="phone"]').forEach(function(e) { IMask(e, { mask: '(000) 000-0000 x00000 ' }); })
    document.querySelectorAll('input[name*="fax"]').forEach(function(e) { IMask(e, { mask: '(000) 000-0000 ' }); })
  }, false);
})();
