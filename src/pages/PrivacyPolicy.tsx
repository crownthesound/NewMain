import React from 'react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <Link to="/" className="flex items-center gap-3">
          <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">Crown</span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">PRIVACY POLICY</h1>
          <p className="text-white/60 mb-8">Last updated May 31, 2025</p>

          <div className="prose prose-invert max-w-none">
            <p className="text-white/80 mb-6">
              This Privacy Notice for Crown The Sound  ("we," "us," or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:
            </p>

            <ul className="list-disc pl-6 text-white/80 space-y-1 mb-6">
              <li>Visit our website at <a href="https://crownthesound.com/" className="text-blue-400 hover:underline">https://crownthesound.com/</a>, or any website of ours that links to this Privacy Notice</li>
              <li>Crown: A Platform for Artists to Compete and Get Discovered. Crown allows artists to submit cover songs to competitions where they can win payment based on the most engaged video. Additionally, they have the chance to be discovered by a label and potentially get signed. Artists can create a profile, enter various competitions, and showcase their talent to both fans and industry professionals.</li>
            </ul>

            <p className="text-white/80 mb-6">
              <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at info@crownthesound.com.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. WHAT INFORMATION DO WE COLLECT?</h2>

            <h3 className="text-lg font-medium text-white mb-3">Personal information you disclose to us</h3>
            <p className="text-white/80 mb-3"><em>In Short:</em> We collect personal information that you provide to us.</p>
            
            <p className="text-white/80 mb-3">We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>
            
            <p className="text-white/80 mb-3"><strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:</p>
            
            <ul className="list-disc pl-6 text-white/80 space-y-1 mb-4">
              <li>names</li>
              <li>phone numbers</li>
              <li>email addresses</li>
              <li>contact preferences</li>
              <li>contact or authentication data</li>
              <li>billing addresses</li>
              <li>mailing addresses</li>
              <li>debit/credit card numbers</li>
            </ul>
            
            <p className="text-white/80 mb-3"><strong>Sensitive Information.</strong> We do not process sensitive information.</p>
            
            <p className="text-white/80 mb-3"><strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is handled and stored by Stripe. You may find their privacy notice link(s) here: <a href="https://stripe.com/privacy" className="text-blue-400 hover:underline">https://stripe.com/privacy</a>.</p>
            
            <p className="text-white/80 mb-3">__________</p>
            
            <p className="text-white/80 mb-3"><strong>Application Data.</strong> If you use our application(s), we also may collect the following information if you choose to provide us with access or permission:</p>
            
            <ul className="list-disc pl-6 text-white/80 space-y-1 mb-4">
              <li><em>Geolocation Information.</em> We may request access or permission to track location-based information from your mobile device, either continuously or while you are using our mobile application(s), to provide certain location-based services. If you wish to change our access or permissions, you may do so in your device's settings.</li>
              <li><em>Mobile Device Data.</em> We automatically collect device information (such as your mobile device ID, model, and manufacturer), operating system, version information and system configuration information, device and application identification numbers, browser type and version, hardware model Internet service provider and/or mobile carrier, and Internet Protocol (IP) address (or proxy server). If you are using our application(s), we may also collect information about the phone network associated with your mobile device, your mobile device's operating system or platform, the type of mobile device you use, your mobile device's unique device ID, and information about the features of our application(s) you accessed.</li>
            </ul>
            
            <p className="text-white/80 mb-6">This information is primarily needed to maintain the security and operation of our application(s), for troubleshooting, and for our internal analytics and reporting purposes.</p>
            
            <p className="text-white/80 mb-3">All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.</p>

            <h3 className="text-lg font-medium text-white mb-3">Information automatically collected</h3>
            <p className="text-white/80 mb-3"><em>In Short:</em> Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.</p>
            
            <p className="text-white/80 mb-3">We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.</p>
            
            <p className="text-white/80 mb-3">The information we collect includes:</p>
            
            <ul className="list-disc pl-6 text-white/80 space-y-1 mb-4">
              <li><em>Log and Usage Data.</em> Log and usage data is service-related, diagnostic, usage, and performance information our servers automatically collect when you access or use our Services and which we record in log files. Depending on how you interact with us, this log data may include your IP address, device information, browser type, and settings and information about your activity in the Services (such as the date/time stamps associated with your usage, pages and files viewed, searches, and other actions you take such as which features you use), device event information (such as system activity, error reports (sometimes called "crash dumps"), and hardware settings).</li>
              <li><em>Device Data.</em> We collect device data such as information about your computer, phone, tablet, or other device you use to access the Services. Depending on the device used, this device data may include information such as your IP address (or proxy server), device and application identification numbers, location, browser type, hardware model, Internet service provider and/or mobile carrier, operating system, and system configuration information.</li>
              <li><em>Location Data.</em> We collect location data such as information about your device's location, which can be either precise or imprecise. How much information we collect depends on the type and settings of the device you use to access the Services. For example, we may use GPS and other technologies to collect geolocation data that tells us your current location (based on your IP address). You can opt out of allowing us to collect this information either by refusing access to the information or by disabling your Location setting on your device. However, if you choose to opt out, you may not be able to use certain aspects of the Services.</li>
            </ul>

            <h3 className="text-lg font-medium text-white mb-3">Information collected from other sources</h3>
            <p className="text-white/80 mb-3"><em>In Short:</em> We may collect limited data from public databases, marketing partners, social media platforms, and other outside sources.</p>
            
            <p className="text-white/80 mb-3">To enhance our ability to provide relevant marketing, offers, and services to you and update our records, we may obtain information about you from other sources, such as public databases, joint marketing partners, affiliate programs, data providers, social media platforms, and other third parties. This information includes mailing addresses, job titles, email addresses, phone numbers, intent data (or user behavior data), Internet Protocol (IP) addresses, social media profiles, social media URLs, and custom profiles, for purposes of targeted advertising and event promotion.</p>
            
            <p className="text-white/80 mb-6">If you interact with us on a social media platform using your social media account (e.g., Facebook or X), we receive personal information about you from such platforms, such as your name, email address, and gender. You may have the right to withdraw your consent to the processing of your personal information. Any personal information that we collect from your social media account depends on your social media account's privacy settings. Please note that their use of your information is not governed by this Privacy Notice.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
            <p className="text-white/80 mb-3"><em>In Short:</em> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with the law. We may also process your information for other purposes with your consent.</p>
            
            <p className="text-white/80 mb-3"><strong>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</strong></p>
            
            <ul className="list-disc pl-6 text-white/80 space-y-1 mb-6">
              <li><strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We may process your information so you can create and log in to your account, as well as keep your account in working order.</li>
              <li><strong>To deliver and facilitate the delivery of services to the user.</strong> We may process your information to provide you with the requested service.</li>
              <li><strong>To fulfill and manage your orders.</strong> We may process your information to fulfill and manage your orders, payments, returns, and exchanges made through the Services.</li>
              <li><strong>To request feedback.</strong> We may process your information when necessary to request feedback and to contact you about your use of our Services.</li>
              <li><strong>To send you marketing and promotional communications.</strong> We may process the personal information you send to us for our marketing purposes, if this is in accordance with your marketing preferences. You can opt out of our marketing emails at any time.</li>
              <li><strong>To deliver targeted advertising to you.</strong> We may process your information to develop and display personalized content and advertising tailored to your interests, location, and more.</li>
              <li><strong>To protect our Services.</strong> We may process your information as part of our efforts to keep our Services safe and secure, including fraud monitoring and prevention.</li>
              <li><strong>To identify usage trends.</strong> We may process information about how you use our Services to better understand how they are being used so we can improve them.</li>
              <li><strong>To determine the effectiveness of our marketing and promotional campaigns.</strong> We may process your information to better understand how to provide marketing and promotional campaigns that are most relevant to you.</li>
              <li><strong>To save or protect an individual's vital interest.</strong> We may process your information when necessary to save or protect an individual's vital interest, such as to prevent harm.</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h2>
            <p className="text-white/80 mb-3"><em>In Short:</em> We only process your personal information when we believe it is necessary and we have a valid legal reason (i.e., legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business interests.</p>
            
            <p className="text-white/80 mb-3"><strong>If you are located in the EU or UK, this section applies to you.</strong></p>
            
            <p className="text-white/80 mb-3">The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on to process your personal information. As such, we may rely on the following legal bases to process your personal information:</p>
            
            <ul className="list-disc pl-6 text-white/80 space-y-1 mb-4">
              <li><strong>Consent.</strong> We may process your information if you have permitted us (i.e., consent) to use your personal information for a specific purpose. You can withdraw your consent at any time.</li>
              <li><strong>Performance of a Contract.</strong> We may process your personal information when we believe it is necessary to fulfill our contractual obligations to you, including providing our Services or at your request prior to entering into a contract with you.</li>
              <li><strong>Legitimate Interests.</strong> We may process your information when we believe it is reasonably necessary to achieve our legitimate business interests and those interests do not outweigh your interests and fundamental rights and freedoms. For example, we may process your personal information for some of the purposes described to:
                <ul className="list-disc pl-6 mt-2">
                  <li>Send users information about special offers and discounts on our products and services</li>
                  <li>Develop and display personalized and relevant advertising content for our users</li>
                  <li>Analyze how our Services are used so we can improve them to engage and retain users</li>
                  <li>Support our marketing activities</li>
                  <li>Diagnose problems and/or prevent fraudulent activities</li>
                  <li>Understand how our users use our products and services so we can improve user experience</li>
                </ul>
              </li>
              <li><strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our legal obligations, such as to cooperate with a law enforcement body or regulatory agency, exercise or defend our legal rights, or disclose your information as evidence in litigation in which we are involved.</li>
              <li><strong>Vital Interests.</strong> We may process your information where we believe it is necessary to protect your vital interests or the vital interests of a third party, such as situations involving potential threats to the safety of any person.</li>
            </ul>
            
            <p className="text-white/80 mb-3"><strong>If you are located in Canada, this section applies to you.</strong></p>
            
            <p className="text-white/80 mb-3">We may process your information if you have given us specific permission (i.e., express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (i.e., implied consent). You can withdraw your consent at any time.</p>
            
            <p className="text-white/80 mb-3">In some exceptional cases, we may be legally permitted under applicable law to process your information without your consent, including, for example:</p>
            
            <ul className="list-disc pl-6 text-white/80 space-y-1 mb-6">
              <li>If collection is clearly in the interests of an individual and consent cannot be obtained in a timely way</li>
              <li>For investigations and fraud detection, and prevention</li>
              <li>For business transactions, provided certain conditions are met</li>
              <li>If it is contained in a witness statement and the collection is necessary to assess, process, or settle an insurance claim</li>
              <li>For identifying injured, ill, or deceased persons and communicating with next of kin</li>
              <li>If we have reasonable grounds to believe an individual has been, is, or may be a victim of financial abuse</li>
              <li>If it is reasonable to expect that collection and use with consent would compromise the availability or the accuracy of the information, and the collection is reasonable for purposes related to investigating a breach of an agreement or a contravention of the laws of Canada or a province</li>
              <li>If disclosure is required to comply with a subpoena, warrant, court order, or rules of the court relating to the production of records</li>
              <li>If it was produced by an individual in the course of their employment, business, or profession, and the collection is consistent with the purposes for which the information was produced</li>
              <li>If the collection is solely for journalistic, artistic, or literary purposes</li>
              <li>If the information is publicly available and is specified by the regulations</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
            <p className="text-white/80 mb-3"><em>In Short:</em> We may share information in specific situations described in this section and/or with the following third parties.</p>
            
            <p className="text-white/80 mb-3">We may need to share your personal information in the following situations:</p>
            
            <ul className="list-disc pl-6 text-white/80 space-y-1 mb-6">
              <li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
              <li><strong>Affiliates.</strong> We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Notice. Affiliates include our parent company and any subsidiaries, joint venture partners, or other companies that we control or that are under common control with us.</li>
              <li><strong>Business Partners.</strong> We may share your information with our business partners to offer you certain products, services, or promotions.</li>
              <li><strong>Offer Wall.</strong> Our application(s) may display a third-party hosted "offer wall." Such an offer wall allows third-party advertisers to offer virtual currency, gifts, or other items to users in return for the acceptance and completion of an advertisement offer. Such an offer wall may appear in our application(s) and be displayed to you based on certain data, such as your geographic area or demographic information. When you click on an offer wall, you will be brought to an external website belonging to other persons and will leave our application(s). A unique identifier, such as your user ID, will be shared with the offer wall provider to prevent fraud and properly credit your account with the relevant reward.</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</h2>
            <p className="text-white/80 mb-3"><em>In Short:</em> If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.</p>
            
            <p className="text-white/80 mb-6">Our Services offer you the ability to register and log in using your third-party social media account details (like your Facebook or X logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, friends list, and profile picture, as well as other information you choose to make public on such a social media platform.</p>
            
            <p className="text-white/80 mb-6">We will use the information we receive only for the purposes that are described in this Privacy Notice or that are otherwise made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information, and how you can set your privacy preferences on their sites and apps.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
            <p className="text-white/80 mb-3"><em>In Short:</em> We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</p>
            
            <p className="text-white/80 mb-3">We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.</p>
            
            <p className="text-white/80 mb-6">When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">7. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
            <p className="text-white/80 mb-3"><em>In Short:</em> We aim to protect your personal information through a system of organizational and technical security measures.</p>
            
            <p className="text-white/80 mb-6">We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">8. DO WE COLLECT INFORMATION FROM MINORS?</h2>
            <p className="text-white/80 mb-3"><em>In Short:</em> We do not knowingly collect data from or market to children under 18 years of age.</p>
            
            <p className="text-white/80 mb-6">We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at info@crownthesound.com.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">9. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
            <p className="text-white/80 mb-3"><em>In Short:</em> Depending on your state of residence in the US or in some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.</p>
            
            <p className="text-white/80 mb-3">In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making. In certain circumstances, you may also have the right to object to the processing of your personal information.</p>
            
            <p className="text-white/80 mb-3">We will consider and act upon any request in accordance with applicable data protection laws.</p>
            
            <p className="text-white/80 mb-3">If you are located in the EEA or UK and you believe we are unlawfully processing your personal information, you also have the right to complain to your <a href="https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm" className="text-blue-400 hover:underline">Member State data protection authority</a> or <a href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/" className="text-blue-400 hover:underline">UK data protection authority</a>.</p>
            
            <p className="text-white/80 mb-3">If you are located in Switzerland, you may contact the <a href="https://www.edoeb.admin.ch/edoeb/en/home.html" className="text-blue-400 hover:underline">Federal Data Protection and Information Commissioner</a>.</p>
            
            <p className="text-white/80 mb-3"><strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below or by updating your preferences.</p>
            
            <p className="text-white/80 mb-3">However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.</p>
            
            <p className="text-white/80 mb-3"><strong>Opting out of marketing and promotional communications:</strong> You can unsubscribe from our marketing and promotional communications at any time by clicking on the unsubscribe link in the emails that we send, replying "STOP" or "UNSUBSCRIBE" to the SMS messages that we send, or by contacting us using the details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below. You will then be removed from the marketing lists. However, we may still communicate with you — for example, to send you service-related messages that are necessary for the administration and use of your account, to respond to service requests, or for other non-marketing purposes.</p>
            
            <p className="text-white/80 mb-3"><strong>Account Information</strong></p>
            
            <p className="text-white/80 mb-3">If you would at any time like to review or change the information in your account or terminate your account, you can:</p>
            
            <ul className="list-disc pl-6 text-white/80 space-y-1 mb-4">
              <li>Log in to your account settings and update your user account.</li>
            </ul>
            
            <p className="text-white/80 mb-6">Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.</p>
            
            <p className="text-white/80 mb-6">If you have questions or comments about your privacy rights, you may email us at info@crownthesound.com.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">10. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
            <p className="text-white/80 mb-6">Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.</p>
            
            <p className="text-white/80 mb-6">California law requires us to let you know how we respond to web browser DNT signals. Because there currently is not an industry or legal standard for recognizing or honoring DNT signals, we do not respond to them at this time.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">11. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>
            <p className="text-white/80 mb-3"><em>In Short:</em> If you are a resident of California or Virginia, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. More information is provided below.</p>
            
            <p className="text-white/80 mb-3"><strong>Categories of Personal Information We Collect</strong></p>
            
            <p className="text-white/80 mb-3">We have collected the following categories of personal information in the past twelve (12) months:</p>
            
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-white/80 border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-4">Category</th>
                    <th className="text-left py-2 px-4">Examples</th>
                    <th className="text-center py-2 px-4">Collected</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-4">A. Identifiers</td>
                    <td className="py-2 px-4">Contact details, such as real name, alias, postal address, telephone or mobile contact number, unique personal identifier, online identifier, Internet Protocol address, email address, and account name</td>
                    <td className="py-2 px-4 text-center">YES</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-4">B. Personal information as defined in the California Customer Records statute</td>
                    <td className="py-2 px-4">Name, contact information, education, employment, employment history, and financial information</td>
                    <td className="py-2 px-4 text-center">YES</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-4">C. Protected classification characteristics under state or federal law</td>
                    <td className="py-2 px-4">Gender, age, date of birth, race and ethnicity, national origin, marital status, and other demographic data</td>
                    <td className="py-2 px-4 text-center">YES</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-4">D. Commercial information</td>
                    <td className="py-2 px-4">Transaction information, purchase history, financial details, and payment information</td>
                    <td className="py-2 px-4 text-center">NO</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-4">E. Biometric information</td>
                    <td className="py-2 px-4">Fingerprints and voiceprints</td>
                    <td className="py-2 px-4 text-center">NO</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-4">F. Internet or other similar network activity</td>
                    <td className="py-2 px-4">Browsing history, search history, online behavior, interest data, and interactions with our and other websites, applications, systems, and advertisements</td>
                    <td className="py-2 px-4 text-center">NO</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-4">G. Geolocation data</td>
                    <td className="py-2 px-4">Device location</td>
                    <td className="py-2 px-4 text-center">NO</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-4">H. Audio, electronic, sensory, or similar information</td>
                    <td className="py-2 px-4">Images and audio, video or call recordings created in connection with our business activities</td>
                    <td className="py-2 px-4 text-center">NO</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-4">I. Professional or employment-related information</td>
                    <td className="py-2 px-4">Business contact details in order to provide you our Services at a business level or job title, work history, and professional qualifications if you apply for a job with us</td>
                    <td className="py-2 px-4 text-center">NO</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-4">J. Education Information</td>
                    <td className="py-2 px-4">Student records and directory information</td>
                    <td className="py-2 px-4 text-center">NO</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-4">K. Inferences drawn from collected personal information</td>
                    <td className="py-2 px-4">Inferences drawn from any of the collected personal information listed above to create a profile or summary about, for example, an individual's preferences and characteristics</td>
                    <td className="py-2 px-4 text-center">YES</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-4">L. Sensitive personal Information</td>
                    <td className="py-2 px-4"></td>
                    <td className="py-2 px-4 text-center">NO</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-white/80 mb-3">We may also collect other personal information outside of these categories through instances where you interact with us in person, online, or by phone or mail in the context of:</p>
            
            <ul className="list-disc pl-6 text-white/80 space-y-1 mb-4">
              <li>Receiving help through our customer support channels;</li>
              <li>Participation in customer surveys or contests; and</li>
              <li>Facilitation in the delivery of our Services and to respond to your inquiries.</li>
            </ul>
            
            <p className="text-white/80 mb-3">We will use and retain the collected personal information as needed to provide the Services or for:</p>
            
            <ul className="list-disc pl-6 text-white/80 space-y-1 mb-4">
              <li>Category A - As long as the user has an account with us</li>
              <li>Category B - As long as the user has an account with us</li>
              <li>Category C - As long as the user has an account with us</li>
              <li>Category K - As long as the user has an account with us</li>
            </ul>
            
            <p className="text-white/80 mb-3"><strong>Will your information be shared with anyone else?</strong></p>
            
            <p className="text-white/80 mb-3">We may disclose your personal information with our service providers pursuant to a written contract between us and each service provider. Learn more about how we disclose personal information to in the section, "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"</p>
            
            <p className="text-white/80 mb-3">We may use your personal information for our business purposes, such as for undertaking internal research for technological development and demonstration. This is not considered to be "selling" of your personal information.</p>
            
            <p className="text-white/80 mb-3">We have not disclosed, sold, or shared any personal information to third parties for a business or commercial purpose in the preceding twelve (12) months. We will not sell or share personal information in the future belonging to website visitors, users, and other consumers.</p>
            
            <p className="text-white/80 mb-3"><strong>Your Rights</strong></p>
            
            <p className="text-white/80 mb-3">You have rights under certain US state data protection laws. However, these rights are not absolute, and in certain cases, we may decline your request as permitted by law. These rights include:</p>
            
            <ul className="list-disc pl-6 text-white/80 space-y-1 mb-4">
              <li><strong>Right to know</strong> whether or not we are processing your personal data</li>
              <li><strong>Right to access</strong> your personal data</li>
              <li><strong>Right to correct</strong> inaccuracies in your personal data</li>
              <li><strong>Right to request</strong> the deletion of your personal data</li>
              <li><strong>Right to obtain a copy</strong> of the personal data you previously shared with us</li>
              <li><strong>Right to non-discrimination</strong> for exercising your rights</li>
              <li><strong>Right to opt out</strong> of the processing of your personal data if it is used for targeted advertising (or sharing as defined under California's privacy law), the sale of personal data, or profiling in furtherance of decisions that produce legal or similarly significant effects ("profiling")</li>
            </ul>
            
            <p className="text-white/80 mb-3">Depending upon the state where you live, you may also have the following rights:</p>
            
            <ul className="list-disc pl-6 text-white/80 space-y-1 mb-4">
              <li>Right to obtain a list of the categories of third parties to which we have disclosed personal data (as permitted by applicable law, including California's privacy law)</li>
              <li>Right to limit use and disclosure of sensitive personal data (as permitted by applicable law, including California's privacy law)</li>
            </ul>
            
            <p className="text-white/80 mb-3"><strong>How to Exercise Your Rights</strong></p>
            
            <p className="text-white/80 mb-3">To exercise these rights, you can contact us by submitting a data subject access request, by emailing us at info@crownthesound.com, or by referring to the contact details at the bottom of this document.</p>
            
            <p className="text-white/80 mb-3">Under certain US state data protection laws, you can designate an authorized agent to request on your behalf. We may deny a request from an authorized agent that does not submit proof that they have been validly authorized to act on your behalf in accordance with applicable laws.</p>
            
            <p className="text-white/80 mb-3"><strong>Request Verification</strong></p>
            
            <p className="text-white/80 mb-3">Upon receiving your request, we will need to verify your identity to determine you are the same person about whom we have the information in our system. We will only use personal information provided in your request to verify your identity or authority to make the request. However, if we cannot verify your identity from the information already maintained by us, we may request that you provide additional information for the purposes of verifying your identity and for security or fraud-prevention purposes.</p>
            
            <p className="text-white/80 mb-3">If you submit the request through an authorized agent, we may need to collect additional information to verify your identity before processing your request, and the agent will need to provide a written and signed permission from you to submit such a request on your behalf.</p>
            
            <p className="text-white/80 mb-6"><strong>California "Shine The Light" Law</strong></p>
            
            <p className="text-white/80 mb-6">California Civil Code Section 1798.83, also known as the "Shine The Light" law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us by using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">12. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
            <p className="text-white/80 mb-3"><em>In Short:</em> Yes, we will update this notice as necessary to stay compliant with relevant laws.</p>
            
            <p className="text-white/80 mb-6">We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">13. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
            <p className="text-white/80 mb-6">If you have questions or comments about this notice, you may email us at info@crownthesound.com or contact us by post at:</p>
            
            <address className="text-white/80 not-italic mb-6">
              Crown The Sound<br />
              1222 Demonbreun St Ste 1801<br />
              Nashville, TN 37203<br />
              United States
            </address>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">14. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
            <p className="text-white/80 mb-6">Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please fill out and submit a data subject access request.</p>
          </div>
        </div>
      </div>
    </div>
  );
}