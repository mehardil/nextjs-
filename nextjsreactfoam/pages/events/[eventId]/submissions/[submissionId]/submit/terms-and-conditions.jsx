import React, { useEffect } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { useToasts } from "react-toast-notifications";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/common/PageHeader";
import ProfileForm from "@/components/forms/ProfileForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Note from "@/components/ui/Note";
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
import { faFlask } from "@fortawesome/free-solid-svg-icons";
import { getSession, useSession } from "next-auth/client";
import { useRouter } from "next/router";

const SubmissionTermsAndConditionsPage = ({
  userSubmission,
  submission,
  event,
}) => {
  const t = useTranslations();
  const globalDispatch = useGlobalDispatch();
  const steps = getSubmissionSteps();
  const [session, loading] = useSession();
  const { addToast } = useToasts();
  const router = useRouter();

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, globalDispatch]);

  const { control, errors, handleSubmit } = useForm({
    defaultValues: {
      terms_and_conditions: userSubmission?.terms_and_conditions,
      publish_consent: userSubmission?.publish,
    },
  });

  const onSubmit = async (params, { redirectToNextStep }) => {
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(),
    };

    const requestParams = requestParamBuilder(params);

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
  };

  return (
    <Wizard
      {...{ steps }}
      onPrevious={({ redirectToPreviousStep }) => {
        redirectToPreviousStep({
          query: { userSubmissionId: userSubmission?.id },
        });
      }}
      onNext={({ redirectToNextStep }) =>
        handleSubmit((params) => onSubmit(params, { redirectToNextStep }))()
      }
    >
      {errors?.terms_and_conditions && (
        <Note color="danger">{t("errors.forms.mustAcceptTermsToProceed")}</Note>
      )}
      {submission?.introduction_text && (
        <SanitizedHTML html={submission?.introduction_text} />
      )}
      <div className="form-row">
        <div className="form-group col-md-12">
          <Controller
            name="terms_and_conditions"
            control={control}
            rules={{
              validate: (input) => {
                return Boolean(input);
              },
            }}
            render={({ name, value, onChange }) => (
              <Input.Checkbox
                name={name}
                defaultChecked={value}
                onChange={onChange}
                label={
                  submission?.terms_and_conditions_question ? (
                    <SanitizedHTML
                      html={submission?.terms_and_conditions_question}
                    />
                  ) : (
                    t("common.forms.defaultValues.submissionTermAndCondition")
                  )
                }
              />
            )}
          />
        </div>
        {submission?.ask_publish_question && (
          <div className="form-group col-md-12">
            <Controller
              name="publish_consent"
              control={control}
              render={({ name, value, onChange }) => (
                <Input.Checkbox
                  name={name}
                  defaultChecked={value}
                  onChange={onChange}
                  label={
                    submission?.terms_and_conditions_question ? (
                      <SanitizedHTML html={submission?.publish_consent} />
                    ) : (
                      t("common.forms.defaultValues.submissionTermAndCondition")
                    )
                  }
                />
              )}
            />
          </div>
        )}
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
          props: {
            session,
            context: await getContextProps(context),
            ...pipeProps,
          },
        };
      }

      return {
        notFound: true,
      };
    }
  );

SubmissionTermsAndConditionsPage.authorized = true;
SubmissionTermsAndConditionsPage.Layout = DashboardLayout;

export default SubmissionTermsAndConditionsPage;
