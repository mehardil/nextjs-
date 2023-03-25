import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { useRouter } from "next/router";
import { useToasts } from "react-toast-notifications";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/common/PageHeader";
import SubmissionCategorisationForm from "@/components/forms/SubmissionCategorisationForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Wizard from "@/components/ui/Wizard2";
import actionTypes from "@/contexts/action-types";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import getSubmissionSteps from "@/etc/submissionSteps";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import { withEvent, withEventSubmission } from "@/utils/pipes";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";
import SanitizedHTML from "react-sanitized-html";
import { striptags } from "striptags";
import isEmpty from "lodash/isEmpty";
import Note from "@/components/ui/Note";

const SubmissionContentPage = ({
  userSubmission,
  submission,
  headers,
  event,
}) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const t = useTranslations();
  const globalDispatch = useGlobalDispatch();
  const steps = getSubmissionSteps();
  const { control, formState, errors, handleSubmit, setError, clearErrors } =
    useForm({
      defaultValues: { content: userSubmission?.content },
    });

  const handleUpdate = async (params, { redirectToNextStep }) => {
    clearErrors();
    const requestParams = requestParamBuilder(params);
    const titleStrip = striptags(requestParams?.content || "");
    const titleWithoutLineBreaks = titleStrip.replace(/[\r\n]/gm, "");

    if (isEmpty(titleWithoutLineBreaks)) {
      setError("content", {
        type: "custom",
        message: "required",
      });
      return false;
    }

    try {
      const userSubmissionResponse = await api({
        headers,
        method: "PUT",
        data: requestParams,
        url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSION, {
          eventId: router.query.eventId,
          submissionId: router.query.submissionId,
          userSubmissionId: userSubmission.id,
        }),
      });

      redirectToNextStep({
        query: {
          userSubmissionId: userSubmissionResponse.data.data.id,
        },
      });
    } catch (e) {
      addToast(
        t("common.notifs.failedToUpdate", {
          entityName: t("common.userSubmission", { entries: 1 }),
          entity: userSubmission.title,
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    }
  };

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, globalDispatch]);

  return (
    <Wizard
      {...{ steps }}
      onPrevious={({ redirectToPreviousStep }) => {
        redirectToPreviousStep({
          query: { userSubmissionId: userSubmission?.id },
        });
      }}
      onNext={({ redirectToNextStep }) =>
        handleSubmit((params) => handleUpdate(params, { redirectToNextStep }))()
      }
    >
      {}
      {formState?.errors?.content?.message && (
        <Note color="danger">
          <span>{t("errors.forms.content")}</span>
        </Note>
      )}

      <SanitizedHTML html={submission?.submit_text} />
      <div className="form-group">
        <Label isRequired>{t("common.content", { entries: 1 })}</Label>
        <Controller
          name="content"
          rules={{
            required: t("errors.forms.required", {
              field: t("common.content", { entries: 1 }),
            }),
          }}
          control={control}
          render={({ name, value, onChange }) => (
            <Input.RichText
              feedback={errors[name] && errors[name].message}
              name={name}
              defaultValue={value}
              onChange={onChange}
            />
          )}
        />
      </div>
    </Wizard>
  );
};

export const getServerSideProps = (context) =>
  serverSidePipe(context, [withEvent, withEventSubmission])(
    async (context, pipeProps) => {
      const session = await getSession(context);

      if (session) {
        if (context.query.userSubmissionId) {
          const headers = {
            Authorization: `Bearer ${session.accessToken}`,
            "X-Tenant": getTenant(context.req),
          };

          const userSubmissionResponse = await api({
            headers,
            url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSION, {
              eventId: context.query.eventId,
              submissionId: context.query.submissionId,
              userSubmissionId: context.query.userSubmissionId,
              query: {
                include: "userSubmissionUser,authors,authors.affiliations",
              },
            }),
          });

          return {
            props: {
              headers,
              session,
              context: await getContextProps(context),
              userSubmission: userSubmissionResponse.data.data,
              ...pipeProps,
            },
          };
        }

        return {
          redirect: {
            permanent: false,
            destination: interpolatePath(
              paths.DELEGATE_SUBMISSIONS_SUBMIT_TERMS,
              {
                eventId: context.query.eventId,
                submissionId: context.query.submissionId,
              }
            ),
          },
          props: {},
        };
      }

      return {
        notFound: true,
      };
    }
  );

SubmissionContentPage.authorized = true;
SubmissionContentPage.Layout = DashboardLayout;

export default SubmissionContentPage;
