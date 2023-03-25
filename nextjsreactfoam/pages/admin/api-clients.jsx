import { getSession } from "next-auth/client";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import SweetAlert from "@/components/ui/PopupAlert";
import { ADMIN } from "@/constants/roles";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import PageHeader from "@/components/common/PageHeader";
import getContextProps from "@/utils/getContextProps";
import nextApi from "@/utils/nextApi";
import React from "react";
import ApiClientModal from "@/components/modals/ApiClientModal";
import api from "@/utils/api";
import { useToasts } from "react-toast-notifications";
import queryString from "query-string";
import getTenant from "@/utils/getTenant";
import isObject from "lodash/isObject";

const APIClient = ({ Apikey, context, session }) => {
  const t = useTranslations();
  const router = useRouter();
  const { addToast } = useToasts();
  const initialNumOfEntries = context.query.perPage;
  const [apiKey, setAPIKeys] = React.useState(Apikey);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const [isDelete, setIsDelete] = React.useState(false);
  const [isEditApi, setIsEditApi] = React.useState(false);
  const [deleteAPIClientId, setToDeleteAPIClientId] = React.useState(undefined);
  const [isSaving, setSaving] = React.useState(false);
  const [isClientodalActive, setClientModalActive] = React.useState(false);

  const columns = [
    { key: "client_id", label: "Client ID" },
    { key: "logo", label: "Logo" },
    { key: "official", label: "Official" },
    { key: "name", label: "Name" },
    { key: "client_secret", label: "Client Secret" },
    { key: "redirect_uri", label: "Redirect Uri" },
    { key: "action", label: "Action" },
  ];

  const handlePageChange = ({ selected }) => {
    router.query.page = selected;
    router.push(router);
  };

  const handleKeywordChange = (keyword) => {
    router.query.keyword = keyword;
    router.push(router);
  };
  const refreshData = () => {
    router.replace(router.asPath);
  };

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

  const handleDelete = (id) => {
    setToDeleteAPIClientId(id);
    setShowDeleteConfirm(true);
  };

  const handleEdit = (item) => {
    setIsEditApi(item);
    setClientModalActive(true);
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={() => {
        setIsEditApi();
        setClientModalActive(true);
      }}
    >
      <Icon icon="plus" className="mr-1" />
      {t("common.forms.addNewEntity", {
        entity: t("common.apiClient", { entries: 1 }),
      })}
    </Button>
  );

  /*update  */

  const onSaveChanges = async ({ official, ...params }) => {
    setSaving(true);

    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      const data = await api.put(
        `/api-keys/${isEditApi?.id}`,
        {
          official: isObject(official) ? official?.value : official,
          ...params,
        },
        {
          headers,
        }
      );

      refreshData();
      addToast("Api Clients has successfully updated", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      addToast("Failed to updated Api Clients", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data) => {
    isEditApi?.id ? onSaveChanges(data) : onCreate(data);
  };

  /*Delete  */
  const onConfirmDelete = async () => {
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      const data = await api.delete(
        `/api-keys/${deleteAPIClientId}`,

        { headers }
      );

      refreshData();
      addToast("Api Clients has successfully Delete", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      addToast("Failed to Delete Api Clients", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const onCreate = async ({ official, ...params }) => {
    setSaving(true);

    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    /* USING ASYNC WE USE TRY ,CATCH AND FINALLY TO CATCH SERVER EROORS INSTEAD OF .THAN  */
    try {
      const data = await api.post(
        "/api-keys",
        {
          official: isObject(official) ? official?.value : official,
          ...params,
        },
        { headers }
      );
      const refreshData = () => {
        router.replace(router.asPath);
      };
      refreshData();
      addToast("Successfully added Api Clients", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      addToast("Failed to added Api Clients", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setClientModalActive(false);
    }
  };

  return (
    <ContentErrorBoundary>
      <PageHeader
        title={t("common.apiClient", { entries: 1 })}
        toolbar={pageHeaderToolbar}
      />
      <Panel
        maximizable
        color="inverse"
        title={t("common.apiClient", { entries: 1 })}
      >
        {isClientodalActive && (
          <ApiClientModal
            isShow={isClientodalActive}
            isSaving={isSaving}
            onHide={() => setClientModalActive(false)}
            onSubmit={onSubmit}
            defaultValues={isEditApi}
          ></ApiClientModal>
        )}
        <div className="clearfix"> </div>
        <Table
          items={Apikey}
          columns={columns}
          batchActions={[]}
          bordered
          {...{ initialNumOfEntries }}
          onPageChange={handlePageChange}
          initialKeyword={context.query.keyword}
          onKeywordChange={handleKeywordChange}
          scopedSlots={{
            client_id: (item) => <td>{item.client_id}</td>,
            logo: (item) => <td>{item.logo}</td>,
            official: (item) => (
              <td>{Boolean(item.official) ? "Yes" : "No"}</td>
            ),
            name: (item) => <td>{item.name}</td>,
            client_secret: (item) => <td>{item.client_secret}</td>,
            redirect_uri: (item) => <td>{item.redirect_uri}</td>,

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
            type="danger"
            confirmBtnText="Delete"
            desc="Are you sure you want to delete this Api key?"
            confirmBtnBsStyle="danger"
            title="Delete Confirmation"
            focusCancelBtn
            onConfirm={onConfirmDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          >
            Are you sure you want to delete this Api key?
          </SweetAlert>
        )}
      </Panel>
    </ContentErrorBoundary>
  );
};
export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  const urlQueryString = queryString.stringify({
    ...context.query,
    page: context.query.page || 1,
  });
  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };
  if (session) {
    const response = await api({
      url: `/api-keys?${urlQueryString}`,
      method: "GET",
      headers: headers,
    });
    return {
      props: {
        session,
        context: await getContextProps(context),
        Apikey: response.data.data,
      },
    };
  }

  return {
    props: {},
  };
};
APIClient.authorized = true;
APIClient.allowedRoles = [ADMIN];
APIClient.Layout = DashboardLayout;
APIClient.defaultProps = {
  Apikey: [],
};

export default APIClient;
