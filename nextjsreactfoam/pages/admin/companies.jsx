import { getSession } from "next-auth/client";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import SweetAlert from "@/components/ui/SweetAlert";
import { ADMIN } from "@/constants/roles";
import getContextProps from "@/utils/getContextProps";
import React from "react";
import getTenant from "@/utils/getTenant";
import PageHeader from "@/components/common/PageHeader";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import api from "@/utils/api";
import { useRouter } from "next/router";
import { useToasts } from "react-toast-notifications";
import CompanyModal from "@/components/modals/CompanyModal";
import { isPlainObject, omit } from "lodash";
import requestParamBuilder from "@/utils/requestParamBuilder";
import SanitizedHTML from "react-sanitized-html";
const Company = ({ context, session, meta, companies }) => {
  const { addToast } = useToasts();
  const router = useRouter();
  const t = useTranslations();
  const initialNumOfEntries = context.query.perPage;
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [toDeleteCompanyId, setToDeleteCompanyId] = React.useState();
  const [isSaving, setSaving] = React.useState(false);
  const [toCompanyModal, setCompanyModal] = React.useState();
  const [editData, setEditData] = React.useState({});
  const [name, setName] = React.useState([]);
  const columns = [
    { key: "organisation", label: "Organisation" },
    { key: "address", label: "Address" },
    { key: "website", label: "Website" },
    { key: "contact_name", label: "Contact Name" },
    { key: "contact_numbers", label: "Contact Numbers" },
    { key: "email", label: "Email" },
    { key: "action", label: "Action" },
  ];
  const dropdownOptions = (item) => {
    return [
      {
        label: (
          <>
            <Icon icon="trash" />
            &nbsp;Delete
          </>
        ),
        onClick: () => {
          handleDelete(item.id);
        },
      },
    ];
  };
  const refreshData = () => {
    router.replace(router.asPath);
  };
  const onCreate = async ({ contacts, ...params }) => {
    setSaving(true);
    const session = await getSession(context);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      const requestBody = requestParamBuilder(omit(params), {
        formData: true,
        isPut: false,
        sanitize: true,

      });
      const data = await api.post(
        "/companies",
        {
          ...params,
          country: params?.country.value,
          state: params?.state.value,
          contacts,
        },
        { headers }
      );

      refreshData();
      addToast("Company successfully created.", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      addToast("Failed to create company.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };
  const onSubmit = async (params) => {
    editData?.id ? onSaveChanges(params) : onCreate(params);
  };
  const onConfirmDelete = async () => {
    const session = await getSession(context);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };
    try {
      const data = await api.delete(`/companies/${toDeleteCompanyId}`, {
        headers,
      });
      addToast("Company successfully deleted.", {
        appearance: "success",
        autoDismiss: true,
      });
      refreshData();
    } catch (e) {
      addToast("Failed to delete company.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };
  const onSaveChanges = async ({ contacts, ...params }) => {
    setSaving(true);
    const session = await getSession(context);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };
    try {
      const data = await api.put(
        `/companies/${editData?.id}`,
        {
          ...params,
          country: params?.country.value,
          contacts,
        },
        {
          headers,
        }
      );
      addToast("Company has successfully updated", {
        appearance: "success",
        autoDismiss: true,
      });
      refreshData();
    } catch (e) {
      addToast("Failed to updated Company", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };
  const handleEdit = (item) => {
    setEditData(item);
    setCompanyModal(true);
    setName([]);
  };
  const handleDelete = (id) => {
    setToDeleteCompanyId(id);
    setShowDeleteConfirm(true);
  };
  const handlePageChange = ({ selected }) => {
    router.query.page = selected;
    router.push(router);
  };
  const handleKeywordChange = (keyword) => {
    router.query.keyword = keyword;
    router.push(router);
  };
  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={() => {
        setCompanyModal(true);
        setEditData({});
      }}
    >
      <Icon icon="plus" className="mr-1" />
      {t("common.forms.addNewEntity", {
        entity: t("common.company", { entries: 1 }),
      })}
    </Button>
  );
  return (
    <ContentErrorBoundary>
      <PageHeader title="Companies" toolbar={pageHeaderToolbar} />
      <Panel title="Companies" color="inverse" maximizable collapsable>
        {toCompanyModal && (
          <CompanyModal
            name={name}
            setName={setName}
            isShow={toCompanyModal}
            onHide={() => {
              setCompanyModal(false);
              setEditData({});
            }}
            onSubmit={onSubmit}
            defaultValues={editData}
            size="lg"
            isSaving={isSaving}
          />
        )}
        <Table
          items={companies}
          columns={columns}
          batchActions={[]}
          bordered
          {...{ initialNumOfEntries }}
          initialPage={meta.current_page}
          onPageChange={handlePageChange}
          onKeywordChange={handleKeywordChange}
          numOfPages={meta.last_page}
          initialKeyword={context.query.keyword}

          scopedSlots={{
            organisation: (item) => <td>{item.organisation}</td>,
            address: (item) => (
              <td>
                {item.address} {item.suburb} {item.state} {item.post_code}{" "}
              </td>
            ),
            website: (item) => <td>{item.website}</td>,
            contact_name: (item) => {
              return (
                <td>
                  {item?.contacts.length > 0 &&
                    item?.contacts.map((contact, i, { length }) => {
                      if (length - 1 === i) {
                        return contact?.name;
                      } else {
                        return <>{contact.name}</>;
                      }
                    })}
                </td>
              );
            },
            contact_numbers: (item) => {
              return (
                <td>
                  {item?.contacts.length > 0 &&
                    item?.contacts.map((contact, i, { length }) => {
                      if (length - 1 === i) {
                        return (
                          <>
                            {i === 0 ? (
                              <h6> PrimaryContact {contact.phone_number}</h6>
                            ) : (
                              <h6>{contact.phone_number}</h6>
                            )}
                          </>
                        );
                      } else {
                        return (
                          <>
                            {i === 0 ? (
                              <h6> PrimaryContact {contact.phone_number}</h6>
                            ) : (
                              <h6>{contact.phone_number}</h6>
                            )}
                            <br />
                          </>
                        );
                      }
                    })}
                </td>
              );
            },



            email: (item) => {


              return (
                <td>
                  {item?.contacts.length > 0 &&
                    item?.contacts.map((contact, i, { length }) => {
                      if (length - 1 === i) {
                          return contact.email;

                      } else {
                        return (
                          <>
                            {" "}
                            {contact.email} <br />
                          </>
                        );
                      }
                    })}
                </td>
              );
              0;
            },

            action: (item) => (
              <td className="m-4">
                <div className="d-flex">
                  <Button.Dropdown
                    size="xs"
                    color="white"
                    options={dropdownOptions(item)}
                  >
                    <Button onClick={() => handleEdit(item)}>Edit</Button>
                  </Button.Dropdown>
                </div>
              </td>
            ),
          }}
        />
        {showDeleteConfirm && (
          <SweetAlert
            danger
            showCancel
            confirmBtnText="Delete"
            type="danger"
            confirmBtnBsStyle="danger"
            desc="Are you sure you want to delete this company?"
            title="Delete Confirmation"
            focusCancelBtn
            onConfirm={onConfirmDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          >
            Are you sure you want to delete this Company itm?
          </SweetAlert>
        )}
      </Panel>
    </ContentErrorBoundary>
  );
};
export const getServerSideProps = async (context) => {
  const urlQueryString = queryString.stringify({
    ...context.query,
    page: context.query.page || 1,
  });
  const session = await getSession(context);
  if (session) {
    const response = await api({
      url: `/companies?${urlQueryString}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    return {
      props: {
        session,
        context: await getContextProps(context),
        companies: response.data.data,
        meta: response.data.meta,
      },
    };
  }
  return {
    props: {},
  };
};
Company.authorized = true;
Company.allowedRoles = [ADMIN];
Company.Layout = DashboardLayout;
Company.defaultProps = {
  companies: [],
};
export default Company;
