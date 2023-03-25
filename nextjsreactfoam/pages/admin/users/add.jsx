import React, { useState } from "react";
import { useSession } from "next-auth/client";
import { useRouter } from "next/router";
import { useForm, FormProvider } from "react-hook-form";
import { useToasts } from "react-toast-notifications";
import isPlainObject from "lodash/isPlainObject";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ProfileForm from "@/components/forms/ProfileForm";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useTranslations } from "next-intl";
import Panel from "@/components/ui/Panel";
import { ADMIN } from "@/constants/roles";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";
import _ from "lodash";
import requestParamBuilder from "@/utils/requestParamBuilder";

const UserAdd = () => {
  const [session, loading] = useSession();
  const router = useRouter();
  const t = useTranslations();
  const { addToast } = useToasts();
  const methods = useForm();
  const [isSaving, setSaving] = useState(false);

  const handleAddUser = async (params) => {
    setSaving(true);

    const requestParams = requestParamBuilder(
      { ...params, no_verify: 1 },
      {
        formData: true,
        sanitize: true,
      }
    );

    try {
      const response = await api({
        url: "users",
        method: "POST",
        data: requestParams,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });

      router.pathname = paths.ADMIN_USERS_PROFILE;
      router.query.userId = response.data?.data?.id;
      router.push(router);
    } catch (error) {
      if (error?.response?.status === 422) {
        let errorMessage = "";
        t("form.errors.already_exists", {
          entity: "error",
        });
        Object.keys(error?.response?.data?.errors).map((itemError, item) => {
          errorMessage += t(error?.response?.data?.errors[itemError], {
            entity: _.capitalize(itemError),
          });
        });
        addToast(errorMessage, {
          appearance: "error",
          autoDismiss: true,
        });
      } else {
        addToast("Failed to save admin", {
          appearance: "error",
          autoDismiss: true,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={methods.handleSubmit(handleAddUser)}
    >
      <Icon icon="save" type="far" className="mr-1" />
      Add User
    </Button>
  );

  return (
    <ContentErrorBoundary>
      <PageHeader title="Add User" toolbar={pageHeaderToolbar} />
      <Panel title="Profile" color="inverse" maximizable collapsable>
        <FormProvider {...methods}>
          <ProfileForm
            {...{ isSaving }}
            fields={[
              ProfileForm.GENERAL_DETAILS,
              ProfileForm.LOGIN_CREDENTIALS,
            ]}
          />
        </FormProvider>
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  return {
    props: {},
  };
};

UserAdd.authorized = true;
// UserAdd.allowedRoles = [ADMIN];
UserAdd.Layout = DashboardLayout;

export default UserAdd;
