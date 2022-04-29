
def boolify_str(str):
    if not str:
        return False

    if str in [True, False]:
        return str
    else:
        import re
        # this returns True, False or None depending on str
        # "1", "True", "true" => True
        # "0", "False", "false", "None", "none" => False
        # all other => None
        if re.search( r'yes|true|1', str, re.I):
            return True
        if re.search( r'none|no|false|0', str, re.I):
            return False

        return False


def collect_processing_data(request):

    collection = request.POST

    addresses = []
    for idx in range(int(collection.get("addresses-count"))):
        action = collection.get("address-{}-action".format(idx+1))

        address = {
            "id": collection.get("address-{}-id".format(idx+1)),
            "address_to":collection.get("address-{}-{}-address_to".format(action, idx+1)),
            "street1":collection.get("address-{}-{}-street1".format(action, idx+1)),
            "street2":collection.get("address-{}-{}-street2".format(action, idx+1)),
            "city": collection.get("address-{}-{}-city".format(action, idx+1)),
            "state": collection.get("address-{}-{}-state".format(action, idx+1)),
            "zip": collection.get("address-{}-{}-zip".format(action, idx+1)),
            "zip4": collection.get("address-{}-{}-zip4".format(action, idx+1)),
            "website": collection.get("address-{}-{}-website".format(action, idx+1)),
            "order_number": collection.get("address-{}-{}-order_number".format(action, idx+1)),

            "main_email": collection.get("address-{}-{}-main_email".format(action, idx+1)),
            "main_phone_number": collection.get("address-{}-{}-main_phone_number".format(action, idx+1)),
            "main_fax_number": collection.get("address-{}-{}-main_fax_number".format(action, idx+1)),

            "is_physical": boolify_str(collection.get("address-{}-{}-is_physical".format(action, idx+1))),
            "is_regular_mail": boolify_str(collection.get("address-{}-{}-is_regular_mail".format(action, idx+1))),

            "primary_contact_id": collection.get("address-{}-{}-primary_contact_id".format(action, idx+1)),
            "functions": [func for func in list(set(collection.getlist("address-{}-{}-functions".format(action, idx+1)))) if len(func)>0],
            "additional_contact_ids": list(set(collection.getlist("address-{}-{}-additional_contacts".format(action, idx+1)))),
            "remove_record": boolify_str(collection.get("address-{}-{}-delete".format(action, idx+1))),
            "add_record": boolify_str(collection.get("address-{}-{}-add".format(action, idx+1))),
            }

        addresses.append(address)

    officers = []
    for idx in range(int(collection.get("officers-count"))):
        action = collection.get("officer-{}-action".format(idx+1))

        officer = {
            "id": collection.get("officer-{}-id".format(idx+1)),
            "office_name": collection.get("officer-{}-{}-office_name".format(action, idx+1)),
            "first_name": collection.get("officer-{}-{}-first_name".format(action, idx+1)),
            "last_name": collection.get("officer-{}-{}-last_name".format(action, idx+1)),
            "phone": collection.get("officer-{}-{}-phone".format(action, idx+1)),
            "fax": collection.get("officer-{}-{}-fax".format(action, idx+1)),
            "email": collection.get("officer-{}-{}-email".format(action, idx+1)),
            "order_number": collection.get("officer-{}-{}-order_number".format(action, idx+1)),
            "remove_record": boolify_str(collection.get("officer-{}-{}-delete".format(action, idx+1))),
            "add_record": boolify_str(collection.get("officer-{}-{}-add".format(action, idx+1))),
            "nonpersistedid": collection.get("officer-{}-{}-nonpersistedid".format(action, idx+1)),
        }
        officers.append(officer)

    action = collection.get("general_information-action")
    genaral_information = {
        "further_instruction": collection.get("general-{}-further_instruction".format(action)),
        "hours": collection.get("general-{}-hours".format(action)),
        "website": collection.get("general-{}-website".format(action)),
        "general_email": collection.get("general-{}-general_email".format(action)),
        "type":collection.get("general-{}-type".format(action)),
    }

    return {
        "officers": officers,
        "addresses": addresses,
        "general_information": genaral_information,
    }


def get_operation_type(ilhs, irhs):
    if ilhs is None or irhs is None:
        return ("Added", "record-addition", False)

    if "DELETE" in ilhs and ilhs.get("DELETE", False):
        return ("Removed", "record-removal", True)

    for key in ilhs:
        try:
            if ilhs[key] != irhs[key]:
                return ("Updates Submitted", "record-amendment", False)
        except KeyError:
            continue

    return ("No Updates Submitted", "record-as-is", False)


def get_change_type(lhs, rhs):
    helper = get_operation_type(lhs, rhs)
    return ({"operation": helper[0], "style_class": helper[1], "removal": helper[2]},)


def merge(lhs, rhs):
    raw_data = list(zip(lhs, rhs))
    for index, (ilhs, irhs) in enumerate(raw_data):
        raw_data[index] = raw_data[index] + get_change_type(ilhs, irhs)
    return raw_data
