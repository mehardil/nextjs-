import { getSession } from "next-auth/client";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Panel from "@/components/ui/Panel";
import Icon from "@/components/ui/Icon";
import { useRouter } from "next/router";
import Button from "@/components/ui/Button";
import PopupAlert from "@/components/ui/PopupAlert";
import { ADMIN } from "@/constants/roles";
import getContextProps from "@/utils/getContextProps";
import api from "@/utils/api";
import React from "react";
import MailTemplateModal from "@/components/modals/MailTemplateModal";
import MailTemplateTable from "@/components/common/MailTemplateTable";
import queryString from "query-string";
import getTenant from "@/utils/getTenant";
import PageHeader from "@/components/common/PageHeader";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import isObject from "lodash/isObject";

const EmailTemplate = ({ emailTemplates, context, session, meta }) => {
  const { addToast } = useToasts();
  const initialNumOfEntries = context.query.perPage;
  const [
    isEmailTemplateAccountModalActive,
    setEmailTemplateAccountModalActive,
  ] = React.useState(false);
  const router = useRouter();
  const t = useTranslations();
  const [emailTemplate, setEmailTemplate] = React.useState([]);
  const [toEditEmailTemplate, setToEditEmailTemplate] = React.useState();
  const [isSaving, setSaving] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [toDeleteEmailTemplateId, setToEmailTemplateId] = React.useState();
  const [allInputValues, setAllInputValues] = React.useState({});

  React.useEffect(() => {
    setEmailTemplate(emailTemplates);
  }, []);

  const handleEdit = (item) => {
    setToEditEmailTemplate(item);
    setEmailTemplateAccountModalActive(true);
  };

  const handlePageChange = ({ selected }) => {
    router.query.page = selected;
    router.push(router);
  };

  const handleKeywordChange = (keyword) => {
    router.query.keyword = keyword;
    router.push(router);
  };

  const handleDelete = (id) => {
    setToEmailTemplateId(id);
    setShowDeleteConfirm(true);
  };

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const onSaveChanges = async ({ entity_type, target, ...data }) => {
    const params = {
      entity_type: isObject(entity_type) ? entity_type?.value : entity_type,
      target: isObject(target) ? target?.value : target,
      ...data,
    };
    setSaving(true);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      const data = await api.put(
        `/mail-templates/${toEditEmailTemplate?.id}`,
        params,
        { headers }
      );

      refreshData();
      addToast("Email Template has successfully updated", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      addToast("Failed to updated Email Template", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const onConfirmDelete = async () => {
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      const response = await api({
        url: `/mail-templates/${toDeleteEmailTemplateId}`,
        method: "DELETE",
        headers,
      });

      refreshData();
      addToast("Email Template has successfully Delete", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      addToast("Failed to Email Template account", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={() => {
        setToEditEmailTemplate();
        setEmailTemplateAccountModalActive(true);
      }}
    >
      <Icon icon="plus" className="mr-1" />
      {t("common.forms.addNewEntity", {
        entity: t("common.emailTemplate"),
      })}
    </Button>
  );

  const onSubmit = async (data) => {
    toEditEmailTemplate?.id ? onSaveChanges(data) : onCreate(data);
  };

  const onCreate = async ({ entity_type, target, ...data }) => {
    const params = {
      entity_type: entity_type?.value,
      target: target?.value,
      ...data,
    };
    setSaving(true);

    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      const data = await api.post("/mail-templates", params, { headers });
      const refreshData = () => {
        router.replace(router.asPath);
      };
      refreshData();
      addToast("Successfully Added Email Template", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      addToast("Failed to added Email Template", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setEmailTemplateAccountModalActive(false);
    }
  };

  return (
    <ContentErrorBoundary>
      <PageHeader
        title={t("common.emailTemplate")}
        toolbar={pageHeaderToolbar}
      />
      <Panel maximizable color="inverse" title={t("common.emailTemplate")}>
        <div className="clearfix" />

        {isEmailTemplateAccountModalActive && (
          <MailTemplateModal
            onSubmit={onSubmit}
            isSaving={isSaving}
            isShow={isEmailTemplateAccountModalActive}
            onHide={() => setEmailTemplateAccountModalActive(false)}
            defaultValues={toEditEmailTemplate}
            setAllInputValues={setAllInputValues}
            allInputValues={allInputValues}
          />
        )}

        <MailTemplateTable
          handleDelete={handleDelete}
          handleEdit={handleEdit}
          initialKeyword={context.query.keyword}
          handlePageChange={handlePageChange}
          handleKeywordChange={handleKeywordChange}
          initialPage={meta.current_page}
          numOfPages={meta.last_page}
          totalItems={meta.total}
          from={meta.from}
          to={meta.to}
          items={emailTemplates}
        />

        {showDeleteConfirm && (
          <PopupAlert
            danger
            showCancel
            confirmBtnText="Delete"
            confirmBtnBsStyle="danger"
            title="Delete Confirmation"
            focusCancelBtn
            type="danger"
            desc="Are you sure you want to delete this email template?"
            onConfirm={onConfirmDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          >
            Are you sure you want to delete this email template?
          </PopupAlert>
        )}
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const urlQueryString = queryString.stringify({
    ...context.query,
    page: context.query.page || 1,
    sortBy: "DateAdded",
  });
  const session = await getSession(context);
  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };
  if (session) {
    const response = await api({
      url: `/mail-templates?${urlQueryString}`,
      method: "GET",
      headers: headers,
    });
    return {
      props: {
        session,
        context: await getContextProps(context),
        emailTemplates: response.data.data,
        meta: response.data.meta,
      },
    };
  }

  return {
    props: {},
  };
};

EmailTemplate.authorized = true;
EmailTemplate.allowedRoles = [ADMIN];
EmailTemplate.Layout = DashboardLayout;
EmailTemplate.defaultProps = {
  EmailTemplate: [],
};

export default EmailTemplate;
