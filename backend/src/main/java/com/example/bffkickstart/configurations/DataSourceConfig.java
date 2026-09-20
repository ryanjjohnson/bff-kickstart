package com.example.bffkickstart.configurations;

import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.Map;

/**
 * The primary ("transactional") datasource - facilities/permits/inspections/state codes, the
 * app's actual domain. Explicitly HikariCP-typed and bound to db.kickstart-tx.* (see
 * application.properties) via @ConfigurationProperties directly on the HikariDataSource bean,
 * rather than Spring Boot's usual spring.datasource.* auto-configuration.
 * <p>
 * The EntityManagerFactory/TransactionManager here are also built by hand, even though this is
 * "the" datasource Spring Boot would normally auto-configure on its own: as soon as any other
 * EntityManagerFactory bean exists anywhere in the context (ReportingDataSourceConfig's), Spring
 * Boot's JPA auto-configuration backs off entirely rather than layering alongside it (verified
 * empirically - the app failed to start with "required a bean named 'entityManagerFactory' that
 * could not be found" the moment the reporting datasource's own manual EMF was added). Bean names
 * ("entityManagerFactory", "transactionManager") match what Spring Boot's own auto-configuration
 * would have used, and what @EnableJpaRepositories below references.
 * <p>
 * Adding @EnableJpaRepositories here (needed for the reporting datasource's own repositories, in
 * ReportingDataSourceConfig) also makes Spring Boot back off its implicit repository scanning for
 * the *whole* application - so this class re-declares scanning for the primary side explicitly too.
 * <p>
 * Same story for Flyway: this app depends only on flyway-core, not Spring Boot 4's
 * spring-boot-flyway auto-configuration module, so nothing runs migrations for it -
 * each datasource builds its own Flyway and calls migrate() itself. The
 * EntityManagerFactory is made to explicitly depend on that bean (@DependsOn) so
 * migrations are guaranteed to run before Hibernate touches the schema. (Under
 * Spring Boot 3 this used the framework's FlywayMigrationInitializer, which also
 * forced Boot's auto-configured Flyway to back off; Boot 4 moved that class into
 * the optional spring-boot-flyway module, and with no auto-Flyway present there's
 * nothing to suppress - migrate() is called directly instead.)
 */
@Configuration
@EnableJpaRepositories(
        basePackages = "com.example.bffkickstart.repositories",
        entityManagerFactoryRef = "entityManagerFactory",
        transactionManagerRef = "transactionManager")
public class DataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties("db.kickstart-tx")
    public HikariDataSource kickstartTxDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }

    @Bean
    public Flyway kickstartTxFlywayInitializer(
            @Qualifier("kickstartTxDataSource") DataSource dataSource) {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .load();
        flyway.migrate();
        return flyway;
    }

    @Bean
    @Primary
    @DependsOn("kickstartTxFlywayInitializer")
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(
            @Qualifier("kickstartTxDataSource") DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean emf = new LocalContainerEntityManagerFactoryBean();
        emf.setDataSource(dataSource);
        emf.setPackagesToScan("com.example.bffkickstart.models");
        emf.setPersistenceUnitName("default");
        emf.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        // Same settings previously bound from spring.jpa.* - see application.properties'
        // comment on hibernate.hbm2ddl.auto=none for why it's "none", not "validate".
        emf.setJpaPropertyMap(Map.of(
                "hibernate.hbm2ddl.auto", "none",
                "hibernate.format_sql", "true",
                "hibernate.jdbc.time_zone", "UTC"));
        return emf;
    }

    @Bean
    @Primary
    public PlatformTransactionManager transactionManager(
            @Qualifier("entityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}
